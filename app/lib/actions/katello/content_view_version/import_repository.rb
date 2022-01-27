module Actions
  module Katello
    module ContentViewVersion
      class ImportRepository < Actions::EntryAction
        def plan(organization, path:, metadata:)
          action_subject(organization)
          sequence do
            import_action =  plan_action(::Actions::Katello::ContentViewVersion::Import, organization: organization,
                                                                        library: false,
                                                                        path: path,
                                                                        metadata: metadata)
            plan_action(::Actions::Katello::ContentView::Remove, import_action.content_view, :destroy_content_view => true)
          end
        end

        def humanized_name
          _("Import Repository")
        end
      end
    end
  end
end
