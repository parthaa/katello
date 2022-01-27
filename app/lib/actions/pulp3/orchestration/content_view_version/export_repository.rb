module Actions
  module Pulp3
    module Orchestration
      module ContentViewVersion
        class ExportRepository < Actions::EntryAction
          def plan(repository, destination_server: nil,
                                 chunk_size: nil)
            action_subject(repository)
            validate_repositories_immediate!(repository)
            content_view = ::Katello::ContentView.create!(name: "tmp-repo-cv-#{SecureRandom.hex(16)}",
                                                          organization: repository.organization,
                                                          repository_ids: [repository.library_instance_or_self.id])
            sequence do
              publish_action = plan_action(::Actions::Katello::ContentView::Publish, content_view, '')
              export_action = plan_action(Actions::Katello::ContentViewVersion::Export,
                                          content_view_version: publish_action.version,
                                          destination_server: destination_server,
                                          chunk_size: chunk_size,)
              plan_self(export_action_output: export_action.output)
              plan_action(::Actions::Katello::ContentView::Remove, content_view, :destroy_content_view => true)
            end
          end

          def run
            output[:export_history_id] = input[:export_action_output][:export_history_id]
          end

          def humanized_name
            _("Export Repository")
          end

          def rescue_strategy
            Dynflow::Action::Rescue::Skip
          end

          def validate_repositories_immediate!(repository)
            unless repository.immediate?
              fail _("NOTE: Unable to fully export repository '%{repository}' because"\
                     " it does not have the 'immediate' download policy."\
                     " Update the download policy and sync the affected repository to include them in the export."\
                       % { repository: repository.name })
            end
          end
        end
      end
    end
  end
end
