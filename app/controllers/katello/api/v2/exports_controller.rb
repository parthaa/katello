module Katello
  class Api::V2::ExportsController < Api::V2::ApiController
    resource_description do
      api_version 'v2'
      api_base_url "/katello/api"
    end

    def_param_group :export do
      param :chunk_size_gb, :number,
                :desc => N_("Split the exported content into archives "\
                              "no greater than the specified size in gigabytes."), :required => false

      param :format, ::Katello::Pulp3::ContentViewVersion::Export::FORMATS,
                     :desc => N_("Export formats."\
                               "Choose syncable if the exported content needs to be in a yum format. "\
                               "This option is only available for %{syncable_repos} repositories. "\
                               "Choose importable if the importing server uses the same version "\
                               " and exported content needs to be one "\
                               "of %{importable_repos} repositories."\
                                % {
                                  syncable_repos: ::Katello::Repository.exportable_types(
                                    format: ::Katello::Pulp3::ContentViewVersion::Export::SYNCABLE).join(", "),
                                  importable_repos: ::Katello::Repository.exportable_types(
                                    format: ::Katello::Pulp3::ContentViewVersion::Export::IMPORTABLE).join(", "),
                                }),
                     :required => false
    end

    def_param_group :org_fail_on_missing_content do
      param :fail_on_missing_content, :bool,
            :desc => N_("Fails if any of the repositories belonging to this organization"\
                        " are unexportable. False by default."), :required => false
    end

    def_param_group :version_fail_on_missing_content do
      param :fail_on_missing_content, :bool,
              :desc => N_("Fails if any of the repositories belonging to this version"\
                          " are unexportable. False by default."), :required => false
    end

    def_param_group :destination_server do
      param :destination_server, String, :desc => N_("Destination Server name"), :required => false
    end

    def export_repository
      tasks = async_task(::Actions::Pulp3::Orchestration::ContentViewVersion::ExportRepository,
                          @repository,
                          chunk_size: params[:chunk_size_gb],
                          from_history: @history,
                          format: find_export_format)
      respond_for_async :resource => tasks
    end

    def export_content_view_version
      tasks = async_task(Actions::Katello::ContentViewVersion::Export,
                  content_view_version: @version,
                  destination_server: params[:destination_server],
                  chunk_size: params[:chunk_size_gb],
                  from_history: @history,
                  format: find_export_format,
                  fail_on_missing_content: ::Foreman::Cast.to_bool(params[:fail_on_missing_content]))

      respond_for_async :resource => tasks
    end

    def export_library
      tasks = async_task(::Actions::Pulp3::Orchestration::ContentViewVersion::ExportLibrary,
                          @organization,
                          destination_server: params[:destination_server],
                          chunk_size: params[:chunk_size_gb],
                          from_history: @history,
                          format: find_export_format,
                          fail_on_missing_content: ::Foreman::Cast.to_bool(params[:fail_on_missing_content]))
      respond_for_async :resource => tasks
    end

    def find_export_format
      if @export_format.present?
        @export_format
      elsif params[:format]
        unless ::Katello::Pulp3::ContentViewVersion::Export::FORMATS.include?(params[:format])
          fail HttpErrors::UnprocessableEntity, _('Invalid export format provided. Format must be one of  %s ') %
                                            ::Katello::Pulp3::ContentViewVersion::Export::FORMATS.join(',')
        end
        params[:format]
      else
        Setting[:default_export_format]
      end
    end

    def find_exportable_repository
      @repository = Repository.find_by_id(params[:id])
      if @repository.blank?
        throw_resource_not_found(name: 'repository', id: params[:id])
      end

      unless @repository.organization.can_export_content?
        throw_resource_not_found(name: 'organization', id: @repository.organization.id)
      end
    end

    def find_exportable_organization
      find_organization
      unless @organization.can_export_content?
        throw_resource_not_found(name: 'organization', id: params[:organization_id])
      end
    end

    def find_exportable_content_view_version
      @version = ContentViewVersion.exportable.find_by_id(params[:id])
      throw_resource_not_found(name: 'content view version', id: params[:id]) if @version.blank?
      @view = @version.content_view
      if @view.rolling?
        fail HttpErrors::BadRequest, _("It's not possible to export a rolling content view.")
      end
    end

    def find_incremental_history
      if params[:since].present? && params[:from_history_id].present?
        fail HttpErrors::BadRequest, _("Cannot specify both 'since' and 'from_history_id' parameters")
      end

      if params[:since].present?
        find_incremental_history_from_since
      elsif params[:from_history_id].present?
        find_incremental_history_from_id
      else
        # Use the latest export
        @history = ::Katello::ContentViewVersionExportHistory.
                      latest(@view, destination_server: params[:destination_server])
        if @history.blank?
          msg = _("No existing export history was found to perform an incremental export. A full export must be performed")
          fail HttpErrors::NotFound, msg
        end
      end
    end

    def find_incremental_history_from_id
      @history = ::Katello::ContentViewVersionExportHistory.find(params[:from_history_id])
      if @history.blank?
        throw_resource_not_found(name: 'export history',
                                  id: params[:from_history_id])
      end
    end

    def find_incremental_history_from_since
      unless params[:since].to_time.is_a?(Time)
        fail HttpErrors::BadRequest, _("Date format is incorrect.")
      end

      since_time = params[:since].to_time
      @history = ::Katello::ContentViewVersionExportHistory.
                      where(content_view_version: @view.content_view.versions).
                      where(destination_server: params[:destination_server]).
                      where("created_at < ?", since_time).
                      order(created_at: :desc).
                      first

      if @history.blank?
        dest_server_msg = params[:destination_server].present? ? " for destination server '#{params[:destination_server]}'" : ""
        msg = _("No existing export history was found before %{date}%{server} to perform an incremental export. A full export must be performed") %
              { date: params[:since], server: dest_server_msg }
        fail HttpErrors::NotFound, msg
      end
    end
  end
end
