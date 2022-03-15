module Actions
  module Pulp3
    module ContentViewVersion
      class DestroyExporter < Pulp3::AbstractAsyncTask
        input_format do
          param :smart_proxy_id, Integer
          param :exporter_data, Hash
          param :format, String
        end

        def invoke_external_task
          ::Katello::Pulp3::ContentViewVersion::Export.create(smart_proxy: smart_proxy, format: input[:format]).destroy_exporter(input[:exporter_data][:pulp_href])
        end
      end
    end
  end
end
