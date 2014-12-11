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
    module ForemanDocker
      module ContainerStepsHelperExtensions extend ActiveSupport::Concern
        def katello_partial(f)
          render(:partial => "/foreman_docker/containers/steps/katello_container", :locals => {:f => f})
        end

        def select_container_capsule(f)
          field(f, 'capsule[id]', :label => _("Capsule")) do
            collection_select :capsule, :id,
                              SmartProxy.with_taxonomy_scope_override(@location, current_org),
                              :id, :name,
                              { :prompt => _("Select a Capsule") },
                              :class => "form-control"
          end
        end

        def select_container_life_cycle_environments(f)
          field(f, 'kt_environment[id]', :label => _("Lifecycle Environment")) do
            collection_select :kt_environment, :id,
                              current_org.kt_environments.authorized(:view_lifecycle_environments),
                              :id, :name,
                              { :prompt => _("Select a Lifecycle Environment")},
                              "data-organization" => current_org.id,
                              :class => "form-control"
          end
        end

        def select_container_content_views(f)
          field(f, 'content_view[id]', :label => _("Content View")) do
            collection_select :content_view, :id,
                              [],
                              :id, :name,
                              { :prompt => _("Select a Content View")},
                              :class => "form-control"
          end
        end

        def select_container_cv_repositories(f)
          field(f, 'repository[id]', :label => _("Repository")) do
            collection_select :repository, :id,
                              [],
                              :id, :name,
                              { :prompt => _("Select a Repository") },
                              :class => "form-control"
          end
        end

        def select_container_cv_tags(f)
          field(f, 'tag[id]', :label => _("Tag")) do
            collection_select :tag, :id,
                              [],
                              :id, :name,
                              { :prompt => _("Select a Tag") },
                              :class => "form-control"
          end
        end

        def current_org
          Organization.find(session[:organization_id])
        end
      end
    end
  end
end
