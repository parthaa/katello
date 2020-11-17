module Katello
  module Authorization::ContentViewVersionExportHistory
    extend ActiveSupport::Concern

    module ClassMethods
      def readable
        where("#{Katello::ContentViewVersionExportHistory.table_name}.content_view_version_id" => Katello::ContentViewVersion.readable)
      end
    end
  end
end
