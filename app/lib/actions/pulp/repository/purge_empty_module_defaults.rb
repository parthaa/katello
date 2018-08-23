module Actions
  module Pulp
    module Repository
      class PurgeEmptyModuleDefaults < Pulp::AbstractAsyncTask
        input_format do
          param :pulp_id, Integer
        end

        def invoke_external_task
          repo = ::Katello::Repository.where(:pulp_id => input[:pulp_id]).first
          modules_to_delete = repo.empty_module_streams.map(&:name)

          repo.unassociate_by_filter(::Katello::ModuleStream::MODULE_STREAM_DEFAULT_CONTENT_TYPE,
                                 "name" => { "$in" => modules_to_delete })
        end
      end
    end
  end
end
