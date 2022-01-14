import { translate as __ } from 'foremanReact/common/I18n';
export const CDN_URL = 'https://cdn.redhat.com';

export  const [CDN, UPSTREAM_SERVER, AIRGAPPED] = ["redhat_cdn", "upstream_server", "airgapped"];
export  const CDN_CONFIGURATION_TYPES = {
  redhat_cdn: __("Red Hat CDN"),
  upstream_server: __("Upstream Foreman Server"),
  airgapped: __("Air-Gapped")
};

export  const CDN_CONFIGURATION_TYPE_MESSAGES = {
  redhat_cdn: __('Red Hat Content is currently consumed from the {type}. '),
  upstream_server: __('Red Hat Content is currently consumed from an {type}. '),
  airgapped: __('Red Hat Content is currently consumed via the {type} process. ')
};

export  const CDN_CONFIGURATION_TYPE_UPDATE_MESSAGES = {
  redhat_cdn: __('Click {update} below to consume Red Hat Content from the {type} instead.'),
  upstream_server: __('Click {update} below to consume Red Hat Content from an {type} instead.'),
  airgapped: __('Click {update} below to consume Red Hat Content via the {type} process instead.')
};

export  const CDN_CONFIGURATION_TYPE_VALUES = {
  redhat_cdn: __("Red Hat CDN"),
  upstream_server: __("Upstream Foreman Server"),
  airgapped: __('Import/Export')
};

export const DEFAULT_CONTENT_VIEW_LABEL = 'Default_Organization_View';
export const DEFAULT_LIFECYCLE_ENVIRONMENT_LABEL = 'Library';