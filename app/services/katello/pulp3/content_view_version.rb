module Katello
  module Pulp3
    class ContentViewVersion
      def initialize(smart_proxy:, content_view_version: nil)
        @smart_proxy = smart_proxy
        @content_view_version = content_view_version
      end

      def exporter_name
        @content_view_version.name.gsub(/\s/, '_')
      end

      def generate_exporter_id
        "#{@content_view_version.organization.label}_#{exporter_name}"
      end

      def generate_exporter_path
        export_path = "#{@content_view_version.content_view}/#{@content_view_version.version}".gsub(/\s/, '_')
        "#{@content_view_version.organization.label}/#{export_path}"
      end

      def api
        ::Katello::Pulp3::Api::Core.new(@smart_proxy)
      end

      def create_exporter(export_base_dir: nil)
        export_base_dir ||= Setting['pulp_export_destination']
        repository_hrefs = @content_view_version.repositories.map { |repo| repo.repository_reference[:repository_href] }
        api.exporter_api.create(name: "#{generate_exporter_id}-#{rand(9999)}",
                                path: "#{export_base_dir}/#{generate_exporter_path}",
                                repositories: repository_hrefs)
      end

      def create_export(exporter_href)
        [api.export_api.create(exporter_href, {})]
      end

      def fetch_export(exporter_href)
        api.export_api.list(exporter_href).results.first
      end

      def destroy_exporter(exporter_href)
        export_data = fetch_export(exporter_href)
        api.exporter_api.partial_update(exporter_href, :last_export => nil)
        api.export_api.delete(export_data.pulp_href)
        api.exporter_api.delete(exporter_href)
      end
    end
  end
end
