module Katello
  module Concerns
    module Api::V2::BulkExtensions
      extend ActiveSupport::Concern

      def find_bulk_items(bulk_params:, model_scope:, key: :id)
        if bulk_params.is_a?(String)
          bulk_params = ActiveSupport::JSON.decode(bulk_params).
                        deep_symbolize_keys
        end
        bulk_params[:included] ||= {}
        bulk_params[:excluded] ||= {}

        if bulk_params[:included][:ids].blank? && bulk_params[:included][:search].nil?
          fail HttpErrors::BadRequest, _("No items have been specified.")
        end

        items = model_scope
        if bulk_params[:included][:ids]
          items = model_scope.where(key => bulk_params[:included][:ids])
        end

        if bulk_params[:included][:search]
          search_items = model_scope.search_for(bulk_params[:included][:search])

          if items.any?
            items = items.merge(search_items)
          else
            items = search_items
          end
        end
        items
      end
    end
  end
end
