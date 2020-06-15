module Actions
  module Pulp3
    module ContentViewVersion
      class DestroyExporter < Pulp3::Abstract
        def plan(smart_proxy, export_data:, exporter_data:)
          plan_self(export_data: export_data, exporter_data: exporter_data, :smart_proxy_id => smart_proxy.id)
        end

        def run
          smart_proxy = SmartProxy.find(input[:smart_proxy_id])
          api = ::Katello::Pulp3::Api::Core.new(smart_proxy)
          api.exporter_api.partial_update(input[:exporter_data][:pulp_href], :last_export => nil)
          api.export_api.delete(input[:export_data][:pulp_href])
          api.exporter_api.delete(input[:exporter_data][:pulp_href])
        end
      end
    end
  end
end
