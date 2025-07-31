import { translateErrorMessage } from 'foremanReact/common/helpers';
import api, { orgId } from '../../services/api';
import {
  SYNC_MANAGEMENT_REQUEST,
  SYNC_MANAGEMENT_SUCCESS,
  SYNC_MANAGEMENT_FAILURE,
  SYNC_STATUS_REQUEST,
  SYNC_STATUS_SUCCESS,
  SYNC_STATUS_FAILURE,
  START_SYNC_REQUEST,
  START_SYNC_SUCCESS,
  START_SYNC_FAILURE,
  CANCEL_SYNC_REQUEST,
  CANCEL_SYNC_SUCCESS,
  CANCEL_SYNC_FAILURE,
  UPDATE_SELECTED_REPOSITORIES,
  TOGGLE_PRODUCT_EXPANSION,
  API_PATHS,
} from './SyncManagementConstants';

// Load initial sync management data
export const loadSyncManagement = () => (dispatch) => {
  dispatch({ type: SYNC_MANAGEMENT_REQUEST });

  return api
    .get(API_PATHS.SYNC_MANAGEMENT, {}, { organization_id: orgId() })
    .then(({ data }) => {
      dispatch({
        type: SYNC_MANAGEMENT_SUCCESS,
        payload: data,
      });
    })
    .catch((result) => {
      dispatch({
        type: SYNC_MANAGEMENT_FAILURE,
        payload: translateErrorMessage(result?.data?.error?.message || result),
      });
    });
};

// Update sync status for specific repositories
export const updateSyncStatus = (repositoryIds) => (dispatch) => {
  if (!repositoryIds || repositoryIds.length === 0) return Promise.resolve();

  dispatch({ type: SYNC_STATUS_REQUEST });

  return api
    .get(API_PATHS.SYNC_STATUS, { repoids: repositoryIds })
    .then(({ data }) => {
      dispatch({
        type: SYNC_STATUS_SUCCESS,
        payload: data,
      });
    })
    .catch((result) => {
      dispatch({
        type: SYNC_STATUS_FAILURE,
        payload: translateErrorMessage(result?.data?.error?.message || result),
      });
    });
};

// Start sync for selected repositories
export const startSync = (repositoryIds) => (dispatch) => {
  dispatch({ type: START_SYNC_REQUEST });

  return api
    .post(API_PATHS.START_SYNC, { repoids: repositoryIds })
    .then(({ data }) => {
      dispatch({
        type: START_SYNC_SUCCESS,
        payload: data,
      });
      // Start polling for status updates
      dispatch(pollSyncStatus(repositoryIds));
    })
    .catch((result) => {
      dispatch({
        type: START_SYNC_FAILURE,
        payload: translateErrorMessage(result?.data?.error?.message || result),
      });
    });
};

// Cancel sync for a specific repository
export const cancelSync = (repositoryId) => (dispatch) => {
  dispatch({ type: CANCEL_SYNC_REQUEST });

  return api
    .delete(API_PATHS.CANCEL_SYNC(repositoryId))
    .then(() => {
      dispatch({
        type: CANCEL_SYNC_SUCCESS,
        payload: { repositoryId },
      });
    })
    .catch((result) => {
      dispatch({
        type: CANCEL_SYNC_FAILURE,
        payload: translateErrorMessage(result?.data?.error?.message || result),
      });
    });
};

// Update selected repositories
export const updateSelectedRepositories = (repositoryIds) => ({
  type: UPDATE_SELECTED_REPOSITORIES,
  payload: repositoryIds,
});

// Toggle product expansion state
export const toggleProductExpansion = (productId) => ({
  type: TOGGLE_PRODUCT_EXPANSION,
  payload: productId,
});

// Polling action for continuous sync status updates
export const pollSyncStatus = (repositoryIds) => (dispatch, getState) => {
  const pollInterval = setInterval(() => {
    const state = getState();
    const runningRepos = state.katello.syncManagement.products
      .flatMap(product => product.repositories)
      .filter(repo => repo.is_running)
      .map(repo => repo.id);

    if (runningRepos.length === 0) {
      clearInterval(pollInterval);
      return;
    }

    dispatch(updateSyncStatus(runningRepos));
  }, 5000);

  // Clean up polling after 30 minutes
  setTimeout(() => {
    clearInterval(pollInterval);
  }, 30 * 60 * 1000);

  return pollInterval;
};