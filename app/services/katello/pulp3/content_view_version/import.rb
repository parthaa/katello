module Katello
  module Pulp3
    module ContentViewVersion
      class Import
        include ImportExportCommon

        def initialize(smart_proxy:, content_view_version: nil, path: nil, metadata: nil, metadata_map: nil)
          @smart_proxy = smart_proxy
          @content_view_version = content_view_version
          @path = path
          @metadata = metadata
          @metadata_map = metadata_map
        end

        def repository_mapping
          mapping = {}
          @metadata[:repositories].each do |key, value|
            repo = @content_view_version.importable_repositories.joins(:root, :product).
                        where("#{::Katello::Product.table_name}" => {:label => value[:product][:label]},
                                                  "#{::Katello::RootRepository.table_name}" => {:label => value[:label]}).first
            next unless repo&.version_href
            repo_info = fetch_repository_info(repo.version_href)
            mapping[key] = repo_info.name
          end
          mapping
        end

        def create_importer
          api.importer_api.create(name: generate_id,
                                  repo_mapping: repository_mapping)
        end

        def create_import(importer_href)
          [api.import_api.create(importer_href, toc: "#{@path}/#{@metadata[:toc]}")]
        end

        def fetch_import(importer_href)
          api.import_api.list(importer_href).results.first
        end

        def destroy_importer(importer_href)
          import_data = fetch_import(importer_href)
          api.import_api.delete(import_data.pulp_href) unless import_data.blank?
          api.importer_api.delete(importer_href)
        end

        def self.check!(content_view:, metadata: nil, metadata_map: nil, path:, smart_proxy:)
          ImportValidator.new(smart_proxy: smart_proxy,
                               content_view: content_view,
                               metadata: metadata,
                               metadata_map: metadata_map,
                               path: path).check!
        end

        def self.intersecting_repos_library_and_metadata(organization:, metadata_repositories:)
          # Returns repositories in library that are part of the metadata
          # In other words if metadata had repos {label:foo, product: bar}
          # this would match it to the repo with the label foo and product bar
          # in the library.

          # TODO: this query needs to account for cp_id now
          queries = metadata_repositories.map do |repo|
            repositories_in_library(organization).
                        where("#{Katello::Product.table_name}.label": repo.product.label,
                              "#{Katello::RootRepository.table_name}.label": repo.label)
          end
          queries.inject(&:or)
        end

        def self.repositories_in_library(organization)
          Katello::Repository.
                    in_default_view.
                    exportable.
                    joins(:product => :provider, :content_view_version => :content_view).
                    joins(:root).
                    where("#{::Katello::ContentView.table_name}.organization_id": organization)
        end

        def self.reset_content_view_repositories_from_metadata!(content_view:, metadata_repositories:)
          # Given metadata from the dump and a content view
          # this method
          # 1) Fetches ids of the library repos whose product name, repo name amd redhat?
          # =>  match values provided in the metadata's repository mapping
          # 2) Removes all the repositories associated to this content view
          # 3) Adds the repositories matched from the dump
          # The main intent of this method is to assume that the user intends for the
          # content view to exaclty look like what is specified in metadata
          repo_ids = intersecting_repos_library_and_metadata(organization: content_view.organization,
                                                             metadata_repositories: metadata_repositories).
                                                             pluck("#{Katello::Repository.table_name}.id")
          content_view.update!(repository_ids: repo_ids)
        end

        def self.import_cv_name_from_export(name:, generated_for:)
          if generated_for == :library_import
            ::Katello::ContentView::IMPORT_LIBRARY
          elsif generated_for == :repository_import
            name.gsub(/^Export/, 'Import')
          else
            name
          end
        end

        def self.process_metadata(metadata_content_view:)
          fail _("Content View label not provided.") if metadata_content_view.label.blank?

          if metadata_content_view.generated_for.blank?
            generated_for = if metadata_content_view.label.start_with? ::Katello::ContentView::EXPORT_LIBRARY
                               :library_export
                             else
                               :none
                             end
          else
            generated_for = metadata_content_view.generated_for.to_sym
          end

          return metadata_content_view.to_h.merge(generated_for: :none) if generated_for == :none

          if generated_for == :library_export
            generated_for = :library_import
          elsif generated_for == :repository_export
            generated_for = :repository_import
          end

          { name: import_cv_name_from_export(name: metadata[:name], generated_for: generated_for),
            label: import_cv_name_from_export(name: metadata[:label], generated_for: generated_for),
            description: "Content View used for importing into library",
            generated_for: generated_for
          }
        end

        def self.find_or_create_import_view(organization:, metadata_content_view:)
          metadata = process_metadata(metadata_content_view: metadata_content_view)
          cv = ::Katello::ContentView.find_by(label: metadata[:label],
                                              organization: organization)
          if cv.blank?
            ::Katello::ContentView.create!(metadata.merge(organization: organization, import_only: true))
          elsif !cv.import_only?
            msg = _("Unable to import in to Content View specified in the metadata - '%{name}'. "\
                     "The 'import_only' attribute for the content view is set to false. "\
                     "To mark this Content View as importable, have your system administrator"\
                     " run the following command on the server. "\
                        % { name: cv.name })
            command = "foreman-rake katello:set_content_view_import_only ID=#{cv.id}"
            fail msg + "\n" + command
          else
            cv.update!(description: metadata[:description]) if cv.description != metadata[:description]
            cv
          end
        end
      end
    end
  end
end
