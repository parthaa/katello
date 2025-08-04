import React from 'react';
import { translate as __ } from 'foremanReact/common/I18n';
import {
  Label,
  Flex,
  FlexItem,
} from '@patternfly/react-core';

// Render hardware model name with description
const renderModelName = ({ name, info }) => (
  <Flex direction={{ default: 'column' }}>
    <FlexItem>
      <strong>{name}</strong>
    </FlexItem>
    {info && (
      <FlexItem>
        <small className="text-muted">
          {info}
        </small>
      </FlexItem>
    )}
  </Flex>
);

// Render vendor information
const renderVendorInfo = ({ vendor_class, hardware_model }) => {
  if (!vendor_class && !hardware_model) {
    return <span className="text-muted">{__('N/A')}</span>;
  }

  return (
    <Flex direction={{ default: 'column' }}>
      {vendor_class && (
        <FlexItem>
          <Label color="blue" isCompact>
            {vendor_class}
          </Label>
        </FlexItem>
      )}
      {hardware_model && (
        <FlexItem>
          <small>{hardware_model}</small>
        </FlexItem>
      )}
    </Flex>
  );
};

// Render host count with link
const renderHostCount = ({ hosts_count, id }) => {
  const count = hosts_count || 0;
  
  if (count === 0) {
    return <span className="text-muted">0</span>;
  }

  return (
    <a href={`/hosts?search=hardware_model_id%3D${id}`}>
      {count}
    </a>
  );
};

// Table column definitions for Hardware Models
export const getHardwareModelsColumns = () => ({
  name: {
    title: __('Name'),
    isSorted: true,
    wrapper: renderModelName,
  },
  vendor_info: {
    title: __('Vendor Information'),
    wrapper: renderVendorInfo,
  },
  hosts_count: {
    title: __('Hosts'),
    wrapper: renderHostCount,
  },
  created_at: {
    title: __('Created'),
    wrapper: ({ created_at }) => (
      <span title={created_at}>
        {created_at ? new Date(created_at).toLocaleDateString() : __('Unknown')}
      </span>
    ),
  },
  updated_at: {
    title: __('Updated'),
    wrapper: ({ updated_at }) => (
      <span title={updated_at}>
        {updated_at ? new Date(updated_at).toLocaleDateString() : __('Unknown')}
      </span>
    ),
  },
});

// Sorting parameters mapping
export const getHardwareModelsSortParams = () => ({
  [__('Name')]: 'name',
  [__('Created')]: 'created_at',
  [__('Updated')]: 'updated_at',
});

// Search autocomplete configuration
export const getHardwareModelsSearchProps = () => ({
  autocomplete: {
    url: '/api/v2/models/auto_complete_search',
    searchQuery: 'search',
  },
  searchProps: {
    placeholder: __('Search hardware models...'),
  },
});

// Default API parameters
export const getDefaultParams = () => ({
  page: 1,
  per_page: 20,
  search: '',
});

// API configuration
export const getApiConfig = () => ({
  key: 'HARDWARE_MODELS_TABLE',
  url: '/api/v2/models',
});