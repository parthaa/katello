module Actions
  module Katello
    module ContentViewVersion
      class IncrementalUpdate < Actions::EntryAction
        include ::Katello::ContentViewHelper
        attr_accessor :new_content_view_version, :new_content_view_version_id

        HUMANIZED_TYPES = {
          ::Katello::Erratum::CONTENT_TYPE => "Errata",
          ::Katello::Rpm::CONTENT_TYPE => "Packages",
          ::Katello::Deb::CONTENT_TYPE => "Deb Packages",
        }.freeze

        def humanized_name
          _("Incremental Update")
        end

        # rubocop:disable Metrics/MethodLength
        # rubocop:disable Metrics/AbcSize
        # rubocop:disable Metrics/CyclomaticComplexity
        # rubocop:disable Metrics/PerceivedComplexity
        def plan(old_version, environments, options = {})
          dep_solve = options.fetch(:resolve_dependencies, true)
          description = options.fetch(:description, '')
          content = options.fetch(:content, {})
          new_components = options.fetch(:new_components, [])

          is_composite = old_version.content_view.composite?
          all_components = is_composite ? calculate_components(old_version, new_components) : []

          action_subject(old_version.content_view)
          validate_environments(environments, old_version)

          new_minor = old_version.content_view.versions.where(:major => old_version.major).maximum(:minor) + 1

          if is_composite
            sequence do
              publish_action = plan_action(::Actions::Katello::ContentView::Publish, old_version.content_view, description,
                          :major => old_version.major, :minor => new_minor,
                          :override_components => new_components, :skip_promotion => true)

              self.new_content_view_version_id = publish_action.content_view_version_id
              plan_self(:is_composite => true, :content_view_id => old_version.content_view.id,
                        :new_content_view_version_id => publish_action.content_view_version_id,
                        :environment_ids => environments.map(&:id), :user_id => ::User.current.id,
                        :history_id => publish_action.history_id,
                        :old_version => old_version.id)

              if old_version.environments.present?
                plan_action(::Actions::Katello::ContentView::Promote, publish_action.version,
                            old_version.environments, true, description)
              end
            end
          else
            self.new_content_view_version = old_version.content_view.create_new_version(old_version.major, new_minor, all_components)
            history = ::Katello::ContentViewHistory.create!(:content_view_version => new_content_view_version, :user => ::User.current.login,
                                                            :action => ::Katello::ContentViewHistory.actions[:publish],
                                                            :status => ::Katello::ContentViewHistory::IN_PROGRESS, :task => self.task,
                                                            :notes => description)

            copy_action_outputs = []
            repos_to_clone = repos_to_copy(old_version, new_components)

            sequence do
              repository_mapping = plan_action(ContentViewVersion::CreateRepos, new_content_view_version, repos_to_clone).repository_mapping
              separated_repo_map = separated_repo_mapping(repository_mapping, true)

              repos_to_clone.each do |source_repos|
                plan_action(Repository::CloneToVersion,
                            source_repos,
                            new_content_view_version,
                            repository_mapping[source_repos],
                            incremental: true)
              end

              concurrence do
                [:pulp3_deb_multicopy, :pulp3_yum_multicopy].each do |mapping|
                  if separated_repo_map[mapping].keys.flatten.present?
                    extended_repo_mapping = pulp3_repo_mapping(separated_repo_map[mapping], old_version)
                    unit_map = pulp3_content_mapping(content)

                    unless extended_repo_mapping.empty? || unit_map.values.flatten.empty?
                      sequence do
                        # Pre-copy content if dest_repo is a soft copy of its library instance.
                        # Don't use extended_repo_mapping because the source repositories are library instances.
                        # We want the old CV snapshot repositories here so as to not pull in excess new content.
                        separated_repo_map[mapping].each do |source_repos, dest_repo|
                          if dest_repo.soft_copy_of_library?
                            source_repos.each do |source_repo|
                              # remove_all flag is set to cover the case of incrementally updating more than once with different content.
                              # Without it, content from the previous incremental update will be copied as well due to how Pulp repo versions work.
                              plan_action(Pulp3::Repository::CopyContent, source_repo, SmartProxy.pulp_primary, dest_repo, copy_all: true, remove_all: true)
                            end
                          end
                        end
                        copy_action_outputs << plan_action(Pulp3::Repository::MultiCopyUnits, extended_repo_mapping, unit_map,
                                                           dependency_solving: dep_solve).output
                        repos_to_clone.each do |source_repos|
                          if separated_repo_map[mapping].keys.include?(source_repos)
                            copy_repos(repository_mapping[source_repos])
                          end
                        end
                      end
                    end
                  end
                end

                if separated_repo_map[:other].keys.flatten.present?
                  repos_to_clone.each do |source_repos|
                    if separated_repo_map[:other].keys.include?(source_repos)
                      copy_repos(repository_mapping[source_repos])
                    end
                  end
                end
              end

              plan_self(:content_view_id => old_version.content_view.id,
                        :new_content_view_version_id => self.new_content_view_version.id,
                        :environment_ids => environments.map(&:id), :user_id => ::User.current.id,
                        :history_id => history.id, :copy_action_outputs => copy_action_outputs,
                        :old_version => old_version.id)
              promote(new_content_view_version, environments)
            end
          end
        end

        def pulp3_content_mapping(content)
          units = ::Katello::Erratum.with_identifiers(content[:errata_ids]) +
            ::Katello::Deb.with_identifiers(content[:deb_ids]) +
            ::Katello::Rpm.with_identifiers(content[:package_ids])
          unit_map = { :errata => [], :debs => [], :rpms => [] }
          units.each do |unit|
            case unit.class.name
            when "Katello::Erratum"
              unit_map[:errata] << unit.id
            when "Katello::Deb"
              unit_map[:debs] << unit.id
            when "Katello::Rpm"
              unit_map[:rpms] << unit.id
            end
          end
          unit_map
        end

        def pulp3_repo_mapping(repo_mapping, old_version)
          pulp3_repo_mapping = {}
          repo_mapping.each do |source_repos, dest_repo|
            old_version_repo = old_version.repositories.archived.find_by(root_id: dest_repo.root_id)

            next if old_version_repo.version_href == old_version_repo.library_instance.version_href

            source_library_repo = source_repos.first.library_instance? ? source_repos.first : source_repos.first.library_instance

            source_repos = [source_library_repo]
            if old_version_repo.version_href.nil?
              base_version = 0
            elsif old_version_repo.soft_copy_of_library?
              base_version = nil
            else
              base_version = old_version_repo.version_href.split("/")[-1].to_i
            end

            pulp3_repo_mapping[source_repos.map(&:id)] = { dest_repo: dest_repo.id, base_version: base_version }
          end
          pulp3_repo_mapping
        end

        def repos_to_copy(old_version, new_components)
          old_version.archived_repos.map do |source_repo|
            components_repo_instances(source_repo, new_components)
          end
        end

        def copy_repos(new_repo)
          sequence do
            plan_action(Katello::Repository::MetadataGenerate, new_repo)
            plan_action(Katello::Repository::IndexContent, id: new_repo.id)
          end
        end

        # For a given repo, find it's instances in both the new and old component versions.
        # This is necessary, since a composite content view may have components containing
        # the same repository within multiple component views and all of the source repos
        # will be needed to publish the new repo.
        def components_repo_instances(old_version_repo, new_component_versions)
          # Attempt to locate the repo instance in the new component versions
          new_repos = nil
          new_component_versions.map do |cvv|
            cvv.repositories.each do |component_repo|
              if component_repo.library_instance_id == old_version_repo.library_instance_id
                new_repos ||= []
                new_repos << component_repo
                break # each CVV can only have 1 repo with this instance id, so go to next CVV
              end
            end
          end

          # If we found it, we need to also locate the repo instance in the old component
          # versions, but omit the one changed by the new component version.
          if new_repos
            old_repos = nil
            old_version_repo.content_view_version.components.each do |component|
              component.archived_repos.each do |component_repo|
                # if the archived repo is not the same source as one of the new repos, include it
                new_repos.each do |new_repo|
                  if (new_repo.library_instance_id == component_repo.library_instance_id) &&
                      (new_repo.content_view.id != component_repo.content_view.id)
                    old_repos ||= []
                    old_repos << component_repo
                  end
                end
              end
            end
            new_repos.concat(old_repos) unless old_repos.blank?
            new_repos
          else
            [old_version_repo]
          end
        end

        def run
          content = { ::Katello::Erratum::CONTENT_TYPE => [],
                      ::Katello::Rpm::CONTENT_TYPE => [],
                      ::Katello::ModuleStream::CONTENT_TYPE => [],
                      ::Katello::Deb::CONTENT_TYPE => [],
                    }

          base_repos = ::Katello::ContentViewVersion.find(input[:old_version]).repositories
          new_repos = ::Katello::ContentViewVersion.find(input[:new_content_view_version_id]).repositories

          if input[:is_composite] || input[:copy_action_outputs].present? && input[:copy_action_outputs].last[:pulp_tasks].present?
            new_repos.each do |new_repo|
              matched_old_repo = base_repos.where(root_id: new_repo.root_id).first

              new_errata = new_repo.errata - (matched_old_repo&.errata || [])
              new_module_streams = new_repo.module_streams - (matched_old_repo&.module_streams || [])
              new_rpms = new_repo.rpms - (matched_old_repo&.rpms || [])
              new_debs = new_repo.debs - (matched_old_repo&.debs || [])

              new_errata.each do |erratum|
                content[::Katello::Erratum::CONTENT_TYPE] << erratum.errata_id
              end
              new_module_streams.each do |module_stream|
                content[::Katello::ModuleStream::CONTENT_TYPE] <<
                  "#{module_stream.name}:#{module_stream.stream}:#{module_stream.version}"
              end
              new_rpms.each do |rpm|
                content[::Katello::Rpm::CONTENT_TYPE] << rpm.nvra
              end
              new_debs.each do |deb|
                content[::Katello::Deb::CONTENT_TYPE] << deb.nva
              end
            end
          end
          output[:added_units] = content
        end

        def finalize
          version = ::Katello::ContentViewVersion.find(input[:new_content_view_version_id])
          version.update_content_counts!
          version.add_applied_filters!
          generate_description(version, output[:added_units]) if version.description.blank?

          history = ::Katello::ContentViewHistory.find(input[:history_id])
          history.status = ::Katello::ContentViewHistory::SUCCESSFUL
          history.save!

          cvv_yum_repos = version.repositories.yum_type
          unless cvv_yum_repos.empty? || SmartProxy.pulp_primary.pulp3_support?(cvv_yum_repos.first)
            cvv_yum_repos.each do |repo|
              SmartProxy.pulp_primary.pulp_api.extensions.send(:module_default).
                copy(repo.library_instance.pulp_id,
                repo.pulp_id)
            end
          end

          if version.latest? && !version.content_view.composite?
            version.auto_publish_composites!
          end
        end

        # given a composite version, and a list of new components, calculate the list of all components for the new version
        def calculate_components(old_version, new_components)
          old_components = old_version.components.select do |component|
            !new_components.map(&:content_view_id).include?(component.content_view_id)
          end
          old_components + new_components
        end

        private

        def generate_description(version, content)
          humanized_lines = []
          [::Katello::Erratum, ::Katello::Rpm].each do |content_type|
            unless content[content_type::CONTENT_TYPE].blank?
              humanized_lines << "#{HUMANIZED_TYPES[content_type::CONTENT_TYPE]}:"
              humanized_lines += content[content_type::CONTENT_TYPE].sort.map { |unit| "    #{unit}" }
            end
            humanized_lines << ''
          end

          version_history = version.history.publish.first
          if version_history.notes
            version_history.notes += "\n"
          else
            version_history.notes = ''
          end

          version_history.notes += humanized_lines.join("\n")
          version_history.save!
          version.save!
        end

        def validate_environments(to_environments, old_version)
          unless (to_environments - old_version.environments).empty?
            fail _("Content View Version %{id} not in all specified environments %{envs}") %
                     {:id => old_version.id, :envs => (to_environments - old_version.environments).map(&:name).join(',')}
          end
        end

        def validate_content(old_version, content, components)
          if old_version.content_view.composite?
            fail(_("Cannot specify content for composite views")) unless content.empty?
            validate_components(old_version, components)
          else
            fail(_("Cannot specify components for non-composite views")) unless components.empty?
          end
        end

        def validate_components(old_version, components)
          old_component_content_view_ids = old_version.components.map(&:content_view_id)
          components.each do |cvv|
            unless old_component_content_view_ids.include?(cvv.content_view_id)
              fail _("No Version of Content View %{component} already exists as a component of the composite Content View %{composite} version %{version}") %
                {:component => self.content_vew.name, :composite => old_version.content_view.name, :version => version.version}
            end
          end
        end

        def promote(new_version, environments)
          plan_action(Katello::ContentView::Promote, new_version, environments, true, nil, true)
        end

        def plan_copy(action_class, source_repo, target_repo, clauses = nil, override_config = nil)
          plan_action(action_class,
                      :source_pulp_id => source_repo.pulp_id,
                      :target_pulp_id => target_repo.pulp_id,
                      :full_clauses => clauses,
                      :override_config => override_config,
                      :include_result => true)
        end
      end
    end
  end
end
