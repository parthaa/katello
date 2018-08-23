module Actions
  module Pulp
    module Repository
      class PurgeEmptyModuleStreams < Pulp::AbstractAsyncTask
        input_format do
          param :pulp_id, Integer
        end

        def invoke_external_task
          repo = ::Katello::Repository.where(:pulp_id => input[:pulp_id]).first
          modules_to_delete = repo.empty_module_streams

          repo.unassociate_by_filter(::Katello::ModuleStream::CONTENT_TYPE,
                                 "id" => { "$in" => modules_to_delete.map(&:uuid) })
        end
      end
    end
  end
end
