module Katello
  module Concerns
    module Api::V2::BulkSystemsExtensions
      extend ActiveSupport::Concern

      def find_bulk_systems(perm_method, bulk_params, restrict_to = nil)
        #works on a structure of param_group bulk_params and transforms it into a list of systems
        bulk_params[:included] ||= {}
        bulk_params[:excluded] ||= {}
        @systems = []

        unless bulk_params[:included][:ids].blank?
          @systems = System.send(perm_method).where(:uuid => bulk_params[:included][:ids])
          @systems.where('uuid not in (?)', bulk_params[:excluded]) unless bulk_params[:excluded][:ids].blank?
          @systems = restrict_to.call(@systems) if restrict_to
        end

        if bulk_params[:included][:search]
          ids = find_system_ids_by_search(bulk_params[:included][:search])
          search_systems = System.send(perm_method).where(:id => ids)
          search_systems = search_systems.where('uuid not in (?)', bulk_params[:excluded][:ids]) unless bulk_params[:excluded][:ids].blank?
          search_systems = restrict_to.call(search_systems) if restrict_to
          @systems += search_systems
        end

        if bulk_params[:included][:ids].blank? && bulk_params[:included][:search].nil?
          fail HttpErrors::BadRequest, _("No systems have been specified.")
        elsif @systems.empty?
          fail HttpErrors::Forbidden, _("Action unauthorized to be performed on selected systems.")
        end
        @systems
      end

      def find_system_ids_by_search(search)
        options = {
          :filters       => System.readable_search_filters(@organization),
          :load_records? => false,
          :full_result => true,
          :fields => [:id]
        }
        item_search(System, {:search => search}, options)[:results].collect { |i| i.id }
      end
    end
  end
end
