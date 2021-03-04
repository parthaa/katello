module Katello
  class Api::V2::ProductContentsController < Api::V2::ApiController
    include Katello::Concerns::FilteredAutoCompleteSearch
    before_action :find_authorized_activation_key, :only => [:index, :auto_complete_search]

    api :GET, "/product_contents", N_("List Product Contents")
    param :activation_key_id, :number, :desc => N_("activation key identifier"), :required => true
    param :content_access_mode_all, :bool, :desc => N_("Get all content available, not just that provided by subscriptions")
    param :content_access_mode_env, :bool, :desc => N_("Limit content to just that available in the activation key's content view version")
    param_group :search, Api::V2::ApiController
    add_scoped_search_description_for(ProductContent)
    def index
      respond_for_index :collection => index_relation
    end

   protected

    def index_relation
      content_access_mode_all = ::Foreman::Cast.to_bool(params[:content_access_mode_all])
      content_access_mode_env = ::Foreman::Cast.to_bool(params[:content_access_mode_env])

      content_finder = ProductContentFinder.new(
          :match_subscription => !content_access_mode_all,
          :match_environment => content_access_mode_env,
          :consumable => @activation_key,
          :search => params[:search]
      )

      content = content_finder.presenter_with_overrides(@activation_key.content_overrides)

      {
        :results => content,
        :total => content.size,
        :subtotal => content.size
      }
    end

    private

    def find_authorized_activation_key
      @activation_key = Katello::ActivationKey.readable.find_by(:id => params[:activation_key_id])
      throw_resource_not_found(name: 'activation_key', id: params[:activation_key_id]) if @activation_key.nil?
    end
  end
end
