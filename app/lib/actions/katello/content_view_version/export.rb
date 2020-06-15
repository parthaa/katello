module Actions
  module Katello
    module ContentViewVersion
      class Export < Actions::EntryAction
        def plan(content_view_version)
          unless File.directory?(Setting['pulp_export_destination'])
            fail ::Foreman::Exception, N_("Unable to export, 'pulp_export_destination' setting is not set to a valid directory.")
          end
          plan_action(::Actions::Pulp3::ContentViewVersion::Export,
                                 content_view_version,
                                 SmartProxy.pulp_master!,
                                 Setting['pulp_export_destination'])
        end

        def humanized_name
          _("Export")
        end

        def rescue_strategy
          Dynflow::Action::Rescue::Skip
        end
      end
    end
  end
end
