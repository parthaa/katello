module Actions
  module Katello
    module ContentViewVersion
      class Import < Actions::EntryAction
        attr_accessor :content_view
        def plan(organization:, path:, metadata:)
          metadata_map = ::Katello::Pulp3::ContentViewVersion::MetadataMap.new(metadata: metadata)

          fail _("Content view not provided in the metadata") if metadata_map.content_view.blank?
          content_view = ::Katello::Pulp3::ContentViewVersion::Import.
                                find_or_create_import_view(organization: organization,
                                                           metadata_content_view: metadata_map.content_view)
          content_view.check_ready_to_import!
          self.content_view = content_view
          ::Katello::Pulp3::ContentViewVersion::Import.check!(content_view: content_view,
                                                              metadata_map: metadata_map,
                                                              path: path,
                                                              smart_proxy: SmartProxy.pulp_primary!)

          major = metadata_map.content_view_version.major
          minor = metadata_map.content_view_version.minor
          description = metadata_map.content_view_version.description

          gpg_helper = ::Katello::Pulp3::ContentViewVersion::ImportGpgKeys.
                          new(organization: organization,
                              metadata_gpg_keys: metadata_map.gpg_keys)
          gpg_helper.import!

          sequence do
            plan_action(AutoCreateProducts, organization: content_view.organization, metadata_products: metadata_map.products)
            plan_action(AutoCreateRepositories, organization: content_view.organization, metadata_repositories: metadata_map.repositories)
            plan_action(AutoCreateRedhatRepositories, organization: content_view.organization, metadata_repositories: metadata_map.repositories)
            plan_action(ResetContentViewRepositoriesFromMetadata, content_view: content_view, metadata_repositories: metadata_map.repositories)
            plan_action(::Actions::Katello::ContentView::Publish, content_view, description,
                          path: path,
                          metadata: metadata,
                          importing: true,
                          major: major,
                          minor: minor)
          end
        end

        def humanized_name
          _("Import Content View Version")
        end
      end
    end
  end
end
