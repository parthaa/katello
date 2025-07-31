module Katello
  class SyncManagementController < Katello::ApplicationController
    include TranslationHelper
    include ActionView::Helpers::DateHelper
    include ActionView::Helpers::NumberHelper
    include SyncManagementHelper::RepoMethods
    helper Rails.application.routes.url_helpers
    helper ReactjsHelper
    respond_to :html, :json

    def section_id
      'contents'
    end

    def title
      _('Sync Status')
    end

    def index
      org = current_organization_object
      
      respond_to do |format|
        format.html do
          # Legacy ERB view - keep for backwards compatibility during transition
          @products = org.library.products.readable
          redhat_products, custom_products = @products.partition(&:redhat?)
          redhat_products.sort_by { |p| p.name.downcase }
          custom_products.sort_by { |p| p.name.downcase }

          @products = redhat_products + custom_products
          @product_size = {}
          @repo_status = {}
          @product_map = collect_repos(@products, org.library, false)

          @products.each { |product| get_product_info(product) }
        end
        format.json do
          # TableIndexPage API format using RABL
          setup_rabl_collection(org)
          render 'katello/api/v2/sync_management/index'
        end
      end
    end

    def sync
      begin
        sync_results = sync_repos(params[:repoids]) || []
        
        # Format sync results for RABL template
        @sync_results = sync_results.map do |result|
          OpenStruct.new(result)
        end
        
        render 'katello/api/v2/sync_management/sync'
      rescue StandardError => e
        render json: { error: e.message }, status: :internal_server_error
      end
    end

    def sync_status
      repos = Repository.where(:id => params[:repoids]).readable.includes(:product)
      
      # Format repositories with sync progress for RABL
      @repositories = repos.map do |repo|
        sync_progress = format_sync_progress(repo)
        
        repo_data = {
          id: repo.id,
          name: repo.name,
          product_name: repo.product.name,
          product_id: repo.product.id,
          content_type: repo.content_type,
          url: repo.url,
          redhat: repo.product.redhat?,
          **sync_progress
        }
        
        OpenStruct.new(repo_data)
      end
      
      render 'katello/api/v2/sync_management/sync_status'
    end

    def destroy
      repo = Repository.where(:id => params[:id]).syncable.first
      repo&.cancel_dynflow_sync
      render :plain => ""
    end

    def auto_complete_search
      suggestions = Repository.complete_for(params[:search] || '')
                             .joins(:product)
                             .limit(params[:limit] || 10)
                             .pluck(:name)
                             .map { |name| OpenStruct.new(label: name, category: _('Repositories')) }
      
      @suggestions = suggestions
      render 'katello/api/v2/sync_management/auto_complete_search'
    end

    private

    def resource_class
      Repository
    end

    def format_sync_progress(repo)
      ::Katello::SyncStatusPresenter.new(repo, latest_task(repo)).sync_progress
    end

    def latest_task(repo)
      repo.latest_dynflow_sync
    end

    # loop through checkbox list of products and sync
    def sync_repos(repo_ids)
      collected = []
      repos = Repository.where(:id => repo_ids).syncable
      repos.each do |repo|
        if latest_task(repo).try(:state) != 'running'
          ForemanTasks.async_task(::Actions::Katello::Repository::Sync, repo)
        end
        collected << format_sync_progress(repo)
      end
      collected
    end

    def get_product_info(product)
      product.repos(product.organization.library).each do |repo|
        @repo_status[repo.id] = format_sync_progress(repo)
      end
    end

    def setup_rabl_collection(org)
      # Get all repositories instead of grouping by products for TableIndexPage
      repositories = Repository.readable.joins(:product)
                              .where(products: { organization_id: org.id })
                              .includes(:product)
                              .order('products.name, katello_repositories.name')
      
      # Apply search if provided
      if params[:search].present?
        repositories = repositories.search_for(params[:search])
      end
      
      # Apply sorting
      if params[:order].present?
        order_param = params[:order]
        direction = order_param.include?('DESC') ? 'DESC' : 'ASC'
        column = order_param.gsub(/(ASC|DESC)/, '').strip
        
        case column
        when 'name'
          repositories = repositories.order("katello_repositories.name #{direction}")
        when 'product_name'
          repositories = repositories.order("products.name #{direction}")
        when 'content_type'
          repositories = repositories.order("katello_repositories.content_type #{direction}")
        end
      end
      
      # Pagination
      page = params[:page]&.to_i || 1
      per_page = params[:per_page]&.to_i || 20
      
      total_count = repositories.count
      paginated_repos = repositories.offset((page - 1) * per_page).limit(per_page)
      
      # Format results with sync progress for RABL template
      results = paginated_repos.map do |repo|
        sync_progress = format_sync_progress(repo)
        
        # Create a hash with repository attributes and sync data
        repo_data = {
          id: repo.id,
          name: repo.name,
          product_name: repo.product.name,
          product_id: repo.product.id,
          content_type: repo.content_type,
          url: repo.url,
          redhat: repo.product.redhat?,
          library_instance_id: repo.library_instance_id,
          backend_identifier: repo.backend_identifier,
          relative_path: repo.relative_path,
          **sync_progress
        }
        
        # Create an OpenStruct to make it work with RABL object notation
        OpenStruct.new(repo_data)
      end
      
      # Set up collection data for RABL metadata template
      @collection = {
        results: results,
        subtotal: total_count,
        page: page,
        per_page: per_page,
        total: total_count,
        can_create: false,
        can_edit: any_syncable?,
        can_delete: false,
        permissions: {
          syncable: any_syncable?
        }
      }
    end

    def calculate_product_sync_state(repositories)
      return 'never_synced' if repositories.empty?
      
      states = repositories.map { |repo| repo[:raw_state] }.compact
      return 'never_synced' if states.empty?
      
      return 'running' if states.include?('running')
      return 'error' if states.include?('error')
      return 'paused' if states.include?('paused')
      return 'stopped' if states.include?('stopped')
      'never_synced'
    end
  end
end
