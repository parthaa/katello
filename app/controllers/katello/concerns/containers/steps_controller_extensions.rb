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
    module Containers
      module StepsControllerExtensions
        extend ActiveSupport::Concern
        included do
          alias_method_chain :update, :katello
        end

        def update_with_katello
          if step == :image && params.has_key?(:kt_environment)
            repo = Repository.find(params[:repository][:id])
            image = DockerImage.find_or_create_by_image_id!(repo.pulp_id)
            tag = DockerTag.find(params[:tag][:id])
            newTag = DockerTag.find_or_create_by_tag_and_docker_image_id!(tag.tag, image.id)
            @container.update_attributes!(:image => image, :tag => newTag)

            # apsule[id]:1
            # kt_environment[id]:1
            # content_view[id]:2
            # repository[id]:3
            # tag[id]:14
            # @container.update_attributes!(
            #     :image => DockerImage.find_or_create_by_image_id(),
            #     :tag => DockerTag.find_or_create_by_tag_and_docker_image_id!(params[:container][:tag],
            #                                                              image.id))
            render_wizard @container
          else
            update_without_katello
          end
        end
      end
    end
  end
end
