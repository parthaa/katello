module Katello
  module Concerns
    module Api::V2::HostsControllerExtensions
      extend ActiveSupport::Concern
      include ForemanTasks::Triggers

      included do
        def destroy
          sync_task(::Actions::Katello::System::HostDestroy, @host)
          process_response(:object => @host)
        end
      end
    end
  end
end
