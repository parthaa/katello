module Actions
  module Katello
    module Repository
      class PurgeEmptyContent < Pulp::AbstractAsyncTask
        input_format do
          param :id, Integer
          param :repository_mapping, Hash
        end

        def invoke_external_task
          repo = ::Katello::Repository.find(input[:id])
          repo.backend_service(SmartProxy.pulp_master).purge_empty_contents(input[:repository_mapping])
        end
      end
    end
  end
end
