import {
  SYNC_MANAGEMENT_REPOSITORIES_KEY,
  SYNC_STATUS_KEY,
  SYNC_REPOSITORIES_KEY,
  getActionNameFromState,
} from './SyncManagementActions';

export const selectSyncManagementRepositories = state =>
  getActionNameFromState(state)[SYNC_MANAGEMENT_REPOSITORIES_KEY] || {};

export const selectSyncManagementRepositoriesResponse = state =>
  selectSyncManagementRepositories(state).response || {};

export const selectSyncManagementRepositoriesStatus = state =>
  selectSyncManagementRepositories(state).status || null;

export const selectSyncManagementRepositoriesError = state =>
  selectSyncManagementRepositories(state).error || null;

export const selectSyncStatus = state =>
  getActionNameFromState(state)[SYNC_STATUS_KEY] || {};

export const selectSyncStatusResponse = state =>
  selectSyncStatus(state).response || [];

export const selectSyncRepositories = state =>
  getActionNameFromState(state)[SYNC_REPOSITORIES_KEY] || {};

export const selectSyncRepositoriesResponse = state =>
  selectSyncRepositories(state).response || {};