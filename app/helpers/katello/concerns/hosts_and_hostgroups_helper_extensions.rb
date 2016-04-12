module Katello
  module Concerns
    module HostsAndHostgroupsHelperExtensions
      extend ActiveSupport::Concern

      included do
        alias_method_chain :os_media, :katello
      end

      def os_media_with_katello
        os_media_without_katello
      end
    end
  end
end
