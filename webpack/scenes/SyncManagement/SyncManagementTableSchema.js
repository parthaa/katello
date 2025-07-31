import React from 'react';
import { translate as __ } from 'foremanReact/common/I18n';
import {
  Label,
  Progress,
  Button,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import { TimesIcon } from '@patternfly/react-icons';

import { SYNC_STATUS } from './SyncManagementConstants';

// Helper function to get status color variant
const getStatusVariant = (status) => {
  switch (status) {
    case SYNC_STATUS.STOPPED:
      return 'blue';
    case SYNC_STATUS.ERROR:
      return 'red';
    case SYNC_STATUS.RUNNING:
      return 'blue';
    case SYNC_STATUS.CANCELED:
      return 'orange';
    case SYNC_STATUS.NEVER_SYNCED:
      return 'grey';
    default:
      return 'grey';
  }
};

// Render sync status with progress and cancel action
const renderSyncStatus = (repository, onCancelSync) => {
  const { state, raw_state, is_running, progress, id } = repository;

  if (is_running && progress?.progress) {
    return (
      <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
        <FlexItem>
          <Progress
            value={progress.progress}
            title={__('Syncing')}
            size="sm"
            style={{ minWidth: '120px' }}
          />
        </FlexItem>
        <FlexItem>
          <Button
            variant="link"
            onClick={() => onCancelSync(id)}
            icon={<TimesIcon />}
            iconPosition="right"
            isSmall
          >
            {__('Cancel')}
          </Button>
        </FlexItem>
      </Flex>
    );
  }

  return (
    <Label color={getStatusVariant(raw_state)}>
      {state || __('Unknown')}
    </Label>
  );
};

// Table column definitions for SyncManagement
export const getSyncManagementColumns = (onCancelSync) => ({
  name: {
    title: __('Repository'),
    isSorted: true,
    wrapper: ({ name, url }) => (
      <Flex direction={{ default: 'column' }}>
        <FlexItem>
          <strong>{name}</strong>
        </FlexItem>
        {url && (
          <FlexItem>
            <small className="text-muted" style={{ wordBreak: 'break-all' }}>
              {url}
            </small>
          </FlexItem>
        )}
      </Flex>
    ),
  },
  product_name: {
    title: __('Product'),
    isSorted: true,
    wrapper: ({ product_name, redhat }) => (
      <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
        <FlexItem>{product_name}</FlexItem>
        {redhat && (
          <FlexItem>
            <Label color="red" isCompact>
              {__('Red Hat')}
            </Label>
          </FlexItem>
        )}
      </Flex>
    ),
  },
  content_type: {
    title: __('Type'),
    isSorted: true,
    wrapper: ({ content_type }) => {
      const getContentTypeColor = (type) => {
        switch (type) {
          case 'yum':
            return 'blue';
          case 'docker':
            return 'cyan';
          case 'ansible_collection':
            return 'red';
          case 'file':
            return 'grey';
          case 'deb':
            return 'purple';
          case 'python':
            return 'gold';
          default:
            return 'grey';
        }
      };

      return (
        <Label color={getContentTypeColor(content_type)} isCompact>
          {content_type || 'unknown'}
        </Label>
      );
    },
  },
  start_time: {
    title: __('Last Sync'),
    wrapper: ({ start_time }) => (
      <span title={start_time}>
        {start_time || __('Never')}
      </span>
    ),
  },
  duration: {
    title: __('Duration'),
    wrapper: ({ duration }) => duration || __('-'),
  },
  display_size: {
    title: __('Content'),
    wrapper: ({ display_size }) => display_size || __('-'),
  },
  sync_status: {
    title: __('Status'),
    wrapper: (repository) => renderSyncStatus(repository, onCancelSync),
  },
});

// Sorting parameters mapping
export const getSyncManagementSortParams = () => ({
  [__('Repository')]: 'name',
  [__('Product')]: 'product_name',
  [__('Type')]: 'content_type',
});

// Bulk action definitions
export const getSyncManagementBulkActions = (onBulkSync, isSyncing) => [
  {
    title: __('Sync Selected Repositories'),
    action: onBulkSync,
    isDisabled: isSyncing,
    icon: 'sync',
  },
];

// Search autocomplete configuration
export const getSyncManagementSearchProps = () => ({
  autocomplete: {
    url: '/katello/sync_management/auto_complete_search',
    searchQuery: 'search',
  },
  searchProps: {
    placeholder: __('Search repositories...'),
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
  key: 'SYNC_MANAGEMENT_TABLE',
  url: '/katello/sync_management',
});