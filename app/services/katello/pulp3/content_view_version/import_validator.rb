module Katello
  module Pulp3
    module ContentViewVersion
      class ImportValidator
        def initialize(content_view:, path:, metadata: nil, metadata_map: nil, smart_proxy:)
          @content_view = content_view
          @path = path
          @smart_proxy = smart_proxy
          @organization = content_view.organization
          @metadata_map = metadata_map || ::Katello::Pulp3::ContentViewVersion::MetadataMap.new(metadata: metadata)
          @redhat_library_products = redhat_library_products
        end

        def check!
          ensure_pulp_importable!
          unless @content_view.default?
            ensure_importing_cvv_does_not_exist!
            ensure_from_cvv_exists!
          end
          ensure_manifest_imported!
          ensure_metadata_matches_repos_in_library!
          ensure_redhat_products_metadata_are_in_the_library!
        end

        def ensure_pulp_importable!
          api = ::Katello::Pulp3::Api::Core.new(@smart_proxy).importer_check_api
          response = api.pulp_import_check_post(toc: "#{@path}/#{@metadata_map.toc}")
          unless response.toc.is_valid
            fail response.toc.messages.join("\n")
          end
        end

        def ensure_importing_cvv_does_not_exist!
          major = @metadata_map.content_view_version.major
          minor = @metadata_map.content_view_version.minor

          if ::Katello::ContentViewVersion.where(major: major, minor: minor, content_view: @content_view).exists?
            fail _("Content View Version specified in the metadata - '%{name}' already exists. "\
                    "If you wish to replace the existing version, delete %{name} and try again. " % { name: "#{@content_view.name} #{major}.#{minor}" })
          end
        end

        def ensure_from_cvv_exists!
          major = @metadata_map.content_view_version.major
          minor = @metadata_map.content_view_version.minor

          if @metadata_map.from_content_view_version
            from_major = @metadata_map.from_content_view_version.major
            from_minor = @metadata_map.from_content_view_version.minor

            unless ::Katello::ContentViewVersion.where(major: from_major, minor: from_minor, content_view: @content_view).exists?
              fail _("Prior Content View Version specified in the metadata - '%{name}' does not exist. "\
                      "Please import the metadata for '%{name}' before importing '%{current}' " % { name: "#{@content_view.name} #{from_major}.#{from_minor}",
                                                                                                    current: "#{@content_view.name} #{major}.#{minor}"})
            end
          end
        end

        def ensure_manifest_imported!
          any_rh_repos = @metadata_map.repositories.any?(&:redhat)
          if any_rh_repos && !@organization.manifest_imported?
            fail _("No manifest found. Import a manifest with the appropriate subscriptions "\
                   "before importing content.")
          end
        end

        def ensure_metadata_matches_repos_in_library!
          interested_repos = ::Katello::Pulp3::ContentViewVersion::Import.
                                      intersecting_repos_library_and_metadata(organization: @organization,
                                                                              metadata_repositories: @metadata_map.repositories)
          bad_repos = interested_repos.select do |katello_repo|
            # TODO: needs to handle cp_id
            metadata_repo = @metadata_map.repositories.find { |r| r.label == katello_repo.label && r.product.label == katello_repo.product.label }

            !(katello_repo.name == metadata_repo.name &&
              katello_repo.label == metadata_repo.label &&
              katello_repo.content_type == metadata_repo.content_type &&
              katello_repo.redhat? == metadata_repo.redhat)
          end

          if bad_repos.any?
            fail _("The following repositories provided in the import metadata have an incorrect content type or provider type. "\
                    "Make sure the export and import repositories are of the same type before importing\n "\
                    "%{repos}" % { content_view: @content_view.name,
                                   repos: generate_product_repo_i18n_string(bad_repos).join("")}
                  )
          end
        end

        def ensure_redhat_products_metadata_are_in_the_library!
          missing = @metadata_map.repositories.select do |repo|
            repo.redhat && katello_product_for_metadata_repo(repo).nil?
          end

          if missing.any?
            repos_in_import = generate_product_repo_i18n_string(missing)
            fail _("The organization's manifest does not contain the subscriptions required to enable the following repositories.\n "\
                    "%{repos}" % { content_view: @content_view.name, repos: repos_in_import.join("")}
                  )
          end
        end

        private

        # See if there's a product in Library that matches the MetadataRepository
        def katello_product_for_metadata_repo(metadata_repo)
          @redhat_library_products.find do |product|
            if metadata_repo.product.cp_id
              product.cp_id == metadata_repo.product.cp_id
            else
              product.label == metadata_repo.product.label
            end
          end
        end

        def redhat_library_products
          ::Katello::Product.in_org(@organization).redhat
        end

        def generate_product_repo_i18n_string(metadata_repos)
          metadata_repos.map do |repo|
            _("\n* Product = '%{product}', Repository = '%{repository}'" % { product: repo.product.name, repository: repo.name })
          end
        end
      end
    end
  end
end
