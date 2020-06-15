module Actions
  module Pulp3
    module ContentViewVersion
      class Export < Pulp3::AbstractAsyncTask
        def plan(content_view_version, smart_proxy, export_base_dir)
          sequence do
            action_output = plan_self(content_view_version_id: content_view_version.id, smart_proxy_id: smart_proxy.id, export_base_dir: export_base_dir).output
            plan_action(::Actions::Pulp3::ContentViewVersion::DestroyExporter,
                        smart_proxy,
                        exporter_data: action_output[:exporter_data],
                        export_data: action_output[:export_data])
          end
        end

        def api
          return @api if @api
          smart_proxy = SmartProxy.find(input[:smart_proxy_id])
          @api = ::Katello::Pulp3::Api::Core.new(smart_proxy)
        end

        def export(cvv)
          export_base_dir = input[:export_base_dir]
          repository_hrefs = cvv.repositories.map { |repo| repo.repository_reference[:repository_href] }
          exporter_data = api.exporter_api.create(name: "#{cvv.generate_exporter_id}-#{rand(9999)}", path: "#{export_base_dir}/#{cvv.generate_exporter_path}",
                                   repositories: repository_hrefs)
          tasks = [api.export_api.create(exporter_data.pulp_href, {})]
          output[:exporter_data] = exporter_data
          output[:pulp_tasks] = tasks
        end

        def invoke_external_task
          cvv = ::Katello::ContentViewVersion.find(input[:content_view_version_id])
          export(cvv)
          output[:pulp_tasks]
        end
      end
    end
  end
end
