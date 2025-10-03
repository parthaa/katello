module Katello
  class Api::V2::SyncManagementController < Api::V2::ApiController
    include SyncManagementHelper::RepoMethods

    before_action :find_organization, only: [:repositories, :sync_status, :sync, :cancel_sync]

    api :GET, "/sync_management/repositories", N_("List repositories with sync status for sync management")
    param :organization_id, :number, :desc => N_("Organization ID")
    param :product_id, :number, :desc => N_("Filter by product ID")
    param :content_type, String, :desc => N_("Filter by content type")
    param_group :search, Api::V2::ApiController
    def repositories
      org = @organization
      fail HttpErrors::BadRequest, _("Organization is required") unless org

      products = org.library.products.readable
      products = products.where(id: params[:product_id]) if params[:product_id]

      repositories = Repository.joins(:root => :product)
                               .where(environment: org.library)
                               .where("#{Product.table_name}.id" => products.pluck(:id))
                               .readable

      repositories = repositories.with_type(params[:content_type]) if params[:content_type]

      collection = scoped_search(repositories.includes(:product, :root), :name, :asc, resource_class: Repository)

      # Add sync status to each repository
      collection[:results].each do |repo|
        sync_status = format_sync_progress(repo)
        repo.define_singleton_method(:sync_status) { sync_status }
      end

      respond_for_index(collection: collection)
    end

    api :GET, "/sync_management/sync_status", N_("Get sync status for multiple repositories")
    param :repository_ids, Array, :desc => N_("Array of repository IDs"), :required => true
    param :organization_id, :number, :desc => N_("Organization ID")
    def sync_status
      repositories = Repository.where(id: params[:repository_ids]).readable
      statuses = repositories.map { |repo| format_sync_progress(repo) }

      render json: statuses
    end

    api :POST, "/sync_management/sync", N_("Sync multiple repositories")
    param :repository_ids, Array, :desc => N_("Array of repository IDs"), :required => true
    param :organization_id, :number, :desc => N_("Organization ID")
    def sync
      repositories = Repository.where(id: params[:repository_ids]).syncable.has_url

      if repositories.empty?
        fail HttpErrors::UnprocessableEntity,
             _("Unable to sync any repository. You either do not have permission or the repositories do not have URLs.")
      end

      task = async_task(::Actions::BulkAction, ::Actions::Katello::Repository::Sync, repositories)

      # Return sync status for each repository
      sync_statuses = repositories.map { |repo| format_sync_progress(repo) }

      render json: {
        task: task.as_json,
        repositories: sync_statuses
      }
    end

    api :DELETE, "/sync_management/cancel_sync", N_("Cancel sync for a repository")
    param :repository_id, :number, :desc => N_("Repository ID"), :required => true
    param :organization_id, :number, :desc => N_("Organization ID")
    def cancel_sync
      repository = Repository.where(id: params[:repository_id]).syncable.first

      if repository&.cancel_dynflow_sync
        render json: { success: true, message: _("Sync canceled") }
      else
        fail HttpErrors::NotFound, _("Repository not found or cannot cancel sync")
      end
    end

    private

    def format_sync_progress(repo)
      ::Katello::SyncStatusPresenter.new(repo, latest_task(repo)).sync_progress
    end

    def latest_task(repo)
      repo.latest_dynflow_sync
    end
  end
end