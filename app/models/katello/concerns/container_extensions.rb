#
# Copyright 2014 Red Hat, Inc.
#
# This software is licensed to you under the GNU General Public
# License as published by the Free Software Foundation; either version
# 2 of the License (GPLv2) or (at your option) any later version.
# There is NO WARRANTY for this software, express or implied,
# including the implied warranties of MERCHANTABILITY,
# NON-INFRINGEMENT, or FITNESS FOR A PARTICULAR PURPOSE. You should
# have received a copy of GPLv2 along with this software; if not, see
# http://www.gnu.org/licenses/old-licenses/gpl-2.0.txt.

module Katello
  module Concerns
    module ContainerExtensions
      extend ActiveSupport::Concern

      included do
        alias_method_chain :parametrize, :katello
      end

      def parametrize_with_katello()
        val = parametrize_without_katello
        image_name = val["Image"].rpartition(":")
        if image_name.first.blank?
          image_name = image_name.last
        else
          image_name = image_name.first
        end
        if Repository.where(:pulp_id => image_name).count > 0
          val["Image"] = "#{URI(SmartProxy.first.url).hostname}:5000/#{val["Image"]}"
        end
        val
      end
    end
  end
end
