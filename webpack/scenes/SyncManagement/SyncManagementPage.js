import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { translate as __ } from 'foremanReact/common/I18n';
import LongDateTime from 'foremanReact/components/common/dates/LongDateTime';
import { ToolbarItem, Button } from '@patternfly/react-core';
import { useAPI } from 'foremanReact/common/hooks/API/APIHooks';
import TableIndexPage from 'foremanReact/components/PF4/TableIndexPage/TableIndexPage';
import { getControllerSearchProps } from 'foremanReact/constants';
import SyncStatusCell from './components/SyncStatusCell';
import { urlBuilder } from 'foremanReact/common/urlHelpers';

const SyncManagementPage = () => {
  const [syncingRepositories, setSyncingRepositories] = useState(new Set());

  // Sync status API for polling
  const syncStatusResponse = useAPI(
    syncingRepositories.size > 0 ? 'get' : null,
    '/katello/api/v2/sync_management/sync_status',
    {
      key: 'SYNC_STATUS',
      params: { repository_ids: Array.from(syncingRepositories) },
    }
  );

  // Poll sync status for syncing repositories
  useEffect(() => {
    let intervalId;
    if (syncingRepositories.size > 0) {
      intervalId = setInterval(() => {
        syncStatusResponse.setAPIOptions({
          params: { repository_ids: Array.from(syncingRepositories) },
        });
      }, 3000); // Poll every 3 seconds
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [syncingRepositories, syncStatusResponse]);

  // Create a map of repository ID to sync status
  const syncStatusMap = React.useMemo(() => {
    const map = new Map();
    if (Array.isArray(syncStatusResponse.response)) {
      syncStatusResponse.response.forEach(status => {
        if (status.id) {
          map.set(status.id, status);
        }
      });
    }
    return map;
  }, [syncStatusResponse.response]);

  // Handle sync repositories
  const handleSync = async (selectedRepositories) => {
    if (!selectedRepositories || selectedRepositories.length === 0) return;

    const repositoryIds = selectedRepositories.map(repo => repo.id);

    try {
      // Trigger sync via API
      const { post } = await import('foremanReact/redux/API');
      await post({
        url: '/katello/api/v2/sync_management/sync',
        params: { repository_ids: repositoryIds },
        successToast: response => `Started sync for ${response.data?.repositories?.length || 0} repositories`,
      });

      setSyncingRepositories(new Set([...syncingRepositories, ...repositoryIds]));
      // Immediately fetch updated sync status
      syncStatusResponse.setAPIOptions({
        params: { repository_ids: repositoryIds },
      });
    } catch (err) {
      console.error('Sync failed:', err);
    }
  };

  // Handle cancel sync
  const handleCancelSync = async (repoId) => {
    try {
      // Trigger cancel sync via API
      const { delete: del } = await import('foremanReact/redux/API');
      await del({
        url: '/katello/api/v2/sync_management/cancel_sync',
        params: { repository_id: repoId },
        successToast: 'Sync canceled',
      });

      const newSyncing = new Set(syncingRepositories);
      newSyncing.delete(repoId);
      setSyncingRepositories(newSyncing);
      // Refresh sync status
      syncStatusResponse.setAPIOptions({
        params: { repository_ids: [repoId] },
      });
    } catch (err) {
      console.error('Cancel sync failed:', err);
    }
  };

  const searchProps = getControllerSearchProps('sync_management');
  if (searchProps && searchProps.autocomplete) {
    searchProps.autocomplete.searchQuery = '';
  }

  const columns = {
    product: {
      title: __('Product'),
      wrapper: (repo) => {
        // Merge sync status data
        const repoWithStatus = {
          ...repo,
          sync_status: syncStatusMap.get(repo.id) || repo.sync_status,
        };
        return (
          <div>
            {repoWithStatus.product?.name}
            {repoWithStatus.product?.orphaned && (
              <span style={{ color: '#f0ad4e', marginLeft: '0.5rem' }}>
                {__('(Orphaned)')}
              </span>
            )}
          </div>
        );
      },
      isSorted: true,
    },
    name: {
      title: __('Repository'),
      wrapper: (repo) => (
        <Link to={urlBuilder('repositories', repo.id)}>
          {repo.name}
        </Link>
      ),
      isSorted: true,
    },
    content_type: {
      title: __('Content Type'),
      wrapper: (repo) => repo.content_type,
      isSorted: true,
    },
    url: {
      title: __('URL'),
      wrapper: (repo) => {
        if (!repo.url) return __('No URL');
        return (
          <a href={repo.url} target="_blank" rel="noopener noreferrer">
            {repo.url.length > 50 ? `${repo.url.substring(0, 50)}...` : repo.url}
          </a>
        );
      },
    },
    last_sync_time: {
      title: __('Last Sync'),
      wrapper: (repo) => {
        return repo.last_sync_time ? (
          <LongDateTime date={repo.last_sync_time} showRelativeTimeTooltip />
        ) : (
          __('Never')
        );
      },
    },
    sync_status: {
      title: __('Sync Status'),
      wrapper: (repo) => {
        // Merge sync status data
        const repoWithStatus = {
          ...repo,
          sync_status: syncStatusMap.get(repo.id) || repo.sync_status,
        };
        return (
          <SyncStatusCell
            syncStatus={repoWithStatus.sync_status}
            repository={repoWithStatus}
            onCancelSync={handleCancelSync}
          />
        );
      },
    },
  };

  const customActionButtons = [
    {
      title: __('Sync Now'),
      action: { onClick: handleSync },
    },
  ];

  return (
    <TableIndexPage
      apiUrl="/katello/api/v2/sync_management/repositories"
      apiOptions={{ key: 'SYNC_MANAGEMENT_REPOSITORIES' }}
      header={__('Sync Status')}
      controller="sync_management"
      creatable={false}
      searchable={true}
      showCheckboxes={true}
      customSearchProps={{
        ...searchProps,
        autocomplete: {
          ...searchProps?.autocomplete,
          endpoint: '/katello/api/v2/sync_management/repositories',
        }
      }}
      columns={columns}
      customActionButtons={customActionButtons}
    />
  );
};

export default SyncManagementPage;