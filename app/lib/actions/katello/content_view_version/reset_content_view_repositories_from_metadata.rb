module Actions
  module Katello
    module ContentViewVersion
      class ResetContentViewRepositoriesFromMetadata < Actions::Base
        def plan(content_view:, metadata_repositories:)
          ::Katello::Pulp3::ContentViewVersion::Import.reset_content_view_repositories_from_metadata!(
            content_view: content_view,
            metadata_repositories: metadata_repositories
          )
        end
      end
    end
  end
end
