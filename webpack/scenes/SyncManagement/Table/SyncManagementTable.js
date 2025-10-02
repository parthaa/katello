import React, { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { omit } from 'lodash';
import { translate as __ } from 'foremanReact/common/I18n';
import LongDateTime from 'foremanReact/components/common/dates/LongDateTime';
import { useSet } from 'foremanReact/components/PF4/TableIndexPage/Table/TableHooks';
import { useTableSort } from 'foremanReact/components/PF4/Helpers/useTableSort';
import { Button, Checkbox, Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core';
import { TableVariant, Thead, Tbody, Th, Tr, Td, ExpandableRowContent } from '@patternfly/react-table';
import TableWrapper from '../../../components/Table/TableWrapper';
import {
  getSyncManagementRepositories,
  syncRepositories,
  cancelSync,
  getSyncStatus,
} from '../SyncManagementActions';
import {
  selectSyncManagementRepositoriesResponse,
  selectSyncManagementRepositoriesStatus,
  selectSyncManagementRepositoriesError,
  selectSyncStatusResponse,
} from '../SyncManagementSelectors';
import SyncStatusCell from '../components/SyncStatusCell';
import { urlBuilder } from 'foremanReact/common/urlHelpers';

const SyncManagementTable = () => {
  const response = useSelector(selectSyncManagementRepositoriesResponse);
  const status = useSelector(selectSyncManagementRepositoriesStatus);
  const error = useSelector(selectSyncManagementRepositoriesError);
  const syncStatusData = useSelector(selectSyncStatusResponse);

  const [searchQuery, updateSearchQuery] = useState('');
  const [selectedRepositories, setSelectedRepositories] = useState(new Set());
  const [syncingRepositories, setSyncingRepositories] = useState(new Set());
  const [syncStatusPolling, setSyncStatusPolling] = useState(null);

  const dispatch = useDispatch();
  const metadata = omit(response, ['results']);
  const { results = [] } = response;

  const columnHeaders = [
    '', // Checkbox column
    __('Product'),
    __('Repository'),
    __('Content Type'),
    __('URL'),
    __('Last Sync'),
    __('Sync Status'),
  ];

  const COLUMNS_TO_SORT_PARAMS = {
    [columnHeaders[1]]: 'product.name',
    [columnHeaders[2]]: 'name',
    [columnHeaders[3]]: 'content_type',
  };

  const {
    pfSortParams,
    apiSortParams,
    activeSortColumn,
    activeSortDirection,
  } = useTableSort({
    allColumns: columnHeaders,
    columnsToSortParams: COLUMNS_TO_SORT_PARAMS,
    initialSortColumnName: 'Product',
  });

  // Create a map of repository ID to sync status
  const syncStatusMap = React.useMemo(() => {
    const map = new Map();
    if (Array.isArray(syncStatusData)) {
      syncStatusData.forEach(status => {
        if (status.id) {
          map.set(status.id, status);
        }
      });
    }
    return map;
  }, [syncStatusData]);

  // Merge sync status into repository data
  const repositoriesWithStatus = React.useMemo(() => {
    return results.map(repo => ({
      ...repo,
      sync_status: syncStatusMap.get(repo.id) || repo.sync_status,
    }));
  }, [results, syncStatusMap]);

  const fetchItems = useCallback(
    params => dispatch(getSyncManagementRepositories({
      ...apiSortParams,
      ...params,
    })),
    [dispatch, apiSortParams],
  );

  // Poll sync status for syncing repositories
  useEffect(() => {
    if (syncingRepositories.size > 0) {
      const intervalId = setInterval(() => {
        dispatch(getSyncStatus(Array.from(syncingRepositories)));
      }, 3000); // Poll every 3 seconds

      setSyncStatusPolling(intervalId);
      return () => clearInterval(intervalId);
    } else if (syncStatusPolling) {
      clearInterval(syncStatusPolling);
      setSyncStatusPolling(null);
    }
    return undefined;
  }, [syncingRepositories, dispatch, syncStatusPolling]);

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedRepositories(new Set(repositoriesWithStatus.map(r => r.id)));
    } else {
      setSelectedRepositories(new Set());
    }
  };

  const handleSelectRepository = (repoId, isSelected) => {
    const newSelected = new Set(selectedRepositories);
    if (isSelected) {
      newSelected.add(repoId);
    } else {
      newSelected.delete(repoId);
    }
    setSelectedRepositories(newSelected);
  };

  const handleSync = async () => {
    if (selectedRepositories.size === 0) return;

    try {
      await dispatch(syncRepositories(Array.from(selectedRepositories)));
      setSyncingRepositories(new Set([...syncingRepositories, ...selectedRepositories]));
      // Immediately fetch updated sync status
      dispatch(getSyncStatus(Array.from(selectedRepositories)));
    } catch (err) {
      console.error('Sync failed:', err);
    }
  };

  const handleCancelSync = async (repoId) => {
    try {
      await dispatch(cancelSync(repoId));
      const newSyncing = new Set(syncingRepositories);
      newSyncing.delete(repoId);
      setSyncingRepositories(newSyncing);
      // Refresh sync status
      dispatch(getSyncStatus([repoId]));
    } catch (err) {
      console.error('Cancel sync failed:', err);
    }
  };

  const isAllSelected = selectedRepositories.size === repositoriesWithStatus.length && repositoriesWithStatus.length > 0;
  const isPartialSelected = selectedRepositories.size > 0 && selectedRepositories.size < repositoriesWithStatus.length;

  const emptyContentTitle = __('No repositories found');
  const emptyContentBody = __('There are no repositories to sync. Try enabling repositories in Products or Red Hat Repositories.');
  const emptySearchTitle = __('No matching repositories found');
  const emptySearchBody = __('Try changing your search settings.');

  return (
    <TableWrapper
      {...{
        error,
        metadata,
        emptyContentTitle,
        emptyContentBody,
        emptySearchTitle,
        emptySearchBody,
        searchQuery,
        updateSearchQuery,
        fetchItems,
      }}
      ouiaId="sync-management-table"
      additionalListeners={[activeSortColumn, activeSortDirection]}
      bookmarkController="katello_sync_management"
      variant={TableVariant.compact}
      status={status}
      autocompleteEndpoint="/katello/api/v2/sync_management/repositories"
      actionButtons={
        <Toolbar>
          <ToolbarContent>
            <ToolbarItem>
              <Button
                variant="primary"
                onClick={handleSync}
                isDisabled={selectedRepositories.size === 0}
              >
                {__('Sync Now')}
              </Button>
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>
      }
    >
      <Thead>
        <Tr ouiaId="syncManagementTableHeaderRow">
          <Th>
            <Checkbox
              isChecked={isAllSelected}
              isIndeterminate={isPartialSelected}
              onChange={(_event, checked) => handleSelectAll(checked)}
              aria-label="Select all repositories"
            />
          </Th>
          {columnHeaders.slice(1).map(col => (
            <Th
              key={col}
              sort={COLUMNS_TO_SORT_PARAMS[col] ? pfSortParams(col) : undefined}
            >
              {col}
            </Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        {repositoriesWithStatus?.map((repository) => {
          const {
            id,
            name,
            content_type: contentType,
            url,
            last_sync_time: lastSyncTime,
            product,
            sync_status: syncStatus,
            permissions,
          } = repository;

          const isSelected = selectedRepositories.has(id);
          const isDisabled = !permissions?.syncable;

          return (
            <Tr key={id} ouiaId={`SyncManagementTableRow-${id}`}>
              <Td>
                <Checkbox
                  isChecked={isSelected}
                  isDisabled={isDisabled}
                  onChange={(_event, checked) => handleSelectRepository(id, checked)}
                  aria-label={`Select repository ${name}`}
                />
              </Td>
              <Td>
                <div>
                  {product?.name}
                  {product?.orphaned && (
                    <span style={{ color: '#f0ad4e', marginLeft: '0.5rem' }}>
                      {__('(Orphaned)')}
                    </span>
                  )}
                </div>
              </Td>
              <Td>
                <Link to={urlBuilder('repositories', id)}>
                  {name}
                </Link>
              </Td>
              <Td>{contentType}</Td>
              <Td>
                {url ? (
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    {url.length > 50 ? `${url.substring(0, 50)}...` : url}
                  </a>
                ) : (
                  __('No URL')
                )}
              </Td>
              <Td>
                {lastSyncTime ? (
                  <LongDateTime date={lastSyncTime} showRelativeTimeTooltip />
                ) : (
                  __('Never')
                )}
              </Td>
              <Td>
                <SyncStatusCell
                  syncStatus={syncStatus}
                  repository={repository}
                  onCancelSync={handleCancelSync}
                />
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </TableWrapper>
  );
};

export default SyncManagementTable;