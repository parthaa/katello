module Katello
  module Pulp3
    module ContentViewVersion
      class SyncableFormatExport < Export
        def repository
          content_view_version.archived_repos.exportable.immediate_or_none.first
        end

        def create_exporter(export_base_dir: Setting['pulpcore_export_destination'])
          api.yum_exporter_api.create(name: generate_id(content_view_version),
                                      path: "#{export_base_dir}/#{generate_exporter_path}",
                                      method: :hardlink )
        end

        def create_export(exporter_href, _options = {})
          [api.yum_export_api.create(exporter_href, publication: repository.publication_href)] unless repository.blank?
        end

        def fetch_export(exporter_href)
          api.yum_export_api.list(exporter_href).results.first
        end

        def destroy_exporter(exporter_href)
          export_data = fetch_export(exporter_href)
          api.yum_export_api.delete(export_data.pulp_href) unless export_data.blank?
          api.yum_exporter_api.delete(exporter_href)
        end

        def generate_exporter_path
          "#{date_dir}/#{repository.library_instance_or_self.relative_path}".gsub(/\s/, '_')
        end
      end
    end
  end
end
