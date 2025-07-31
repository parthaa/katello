import React, { useState, useEffect } from 'react';
import { translate as __ } from 'foremanReact/common/I18n';

import TableIndexPage from 'foremanReact/components/PF4/TableIndexPage/TableIndexPage';

import {
  getSyncManagementColumns,
  getSyncManagementSortParams,
  getSyncManagementBulkActions,
  getSyncManagementSearchProps,
  getDefaultParams,
  getApiConfig,
} from './SyncManagementTableSchema';
import api from '../../services/api';

const SyncManagementTablePage = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [pollInterval, setPollInterval] = useState(null);
  
  // Get configuration from schema
  const apiConfig = getApiConfig();
  const searchProps = getSyncManagementSearchProps();

  // Cancel individual sync
  const handleCancelSync = async (repositoryId) => {
    try {
      await api.delete(`/katello/sync_management/${repositoryId}`);
      // Refresh table data after cancel
      window.location.reload();
    } catch (error) {
      console.error('Cancel sync failed:', error);
    }
  };

  // Get columns with cancel sync handler
  const columns = getSyncManagementColumns(handleCancelSync);
  const columnsToSortParams = getSyncManagementSortParams();

  // Bulk sync action
  const handleBulkSync = async (selectedRepositories) => {
    if (selectedRepositories.length === 0) return;

    setIsSyncing(true);
    try {
      const repositoryIds = selectedRepositories.map(repo => repo.id);
      await api.post('/katello/sync_management/sync', { repoids: repositoryIds });
      
      // Start polling for status updates
      startPolling();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Polling for sync status updates
  const startPolling = () => {
    if (pollInterval) return; // Already polling

    const interval = setInterval(() => {
      // The TableIndexPage will automatically refresh data
      window.location.reload();
    }, 5000);

    setPollInterval(interval);

    // Stop polling after 30 minutes
    setTimeout(() => {
      if (interval) {
        clearInterval(interval);
        setPollInterval(null);
      }
    }, 30 * 60 * 1000);
  };

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  return (
    <TableIndexPage
      apiUrl={apiConfig.url}
      apiOptions={{ key: apiConfig.key }}
      header={__('Sync Status')}
      controller={apiConfig.url}
      customSearchProps={searchProps}
      hasHelpText
      helpText={__('Manage repository synchronization status and sync repositories.')}
      columns={columns}
      columnsToSortParams={columnsToSortParams}
      bulkActions={getSyncManagementBulkActions(handleBulkSync, isSyncing)}
      showCheckboxes
    />
  );
};

export default SyncManagementTablePage;