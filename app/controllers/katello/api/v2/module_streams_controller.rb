module Katello
  class Api::V2::ModuleStreamsController < Api::V2::ApiController
    extend ::Apipie::DSL::Concern
    apipie_concern_subst(:a_resource => N_("a module stream"), :resource => "module_streams")
    include Katello::Concerns::Api::V2::RepositoryContentController

    before_action :find_host, :only => :index
    update_api(:index) do
      param :host_id, :number, :desc => N_("Host id to list module streams for")
      param :name_stream_only, :boolean, :desc => N_("Return name and stream information only)")
      param :enabled_only, :boolean, :desc => N_("Return only enabled streams)")
    end
    def index
      if ::Foreman::Cast.to_bool(params[:name_stream_only])
        sort_by, sort_order, options = sort_options
        options[:group] = [:name, :stream]
        respond(:collection => scoped_search(index_relation, sort_by, sort_order, options),
                :template => 'name_streams')
      else
        super
      end
    end
    def custom_index_relation(collection)
      if @host
        collection  = collection.available_for_hosts([@host.id])
        if ::Foreman::Cast.to_bool(params[:enabled_only])
        end
      else
        collection
      end
    end

    def default_sort
      %w(name asc)
    end
  end
end
