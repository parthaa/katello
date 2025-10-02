import { get, post, delete as del } from 'foremanReact/redux/API';

const getActionNameFromState = state => state.katello.syncManagement;
const apiUrl = '/katello/api/v2/sync_management';

export const SYNC_MANAGEMENT_REPOSITORIES_KEY = 'SYNC_MANAGEMENT_REPOSITORIES';
export const SYNC_STATUS_KEY = 'SYNC_STATUS';
export const SYNC_REPOSITORIES_KEY = 'SYNC_REPOSITORIES';

export const getSyncManagementRepositories = (params = {}) => (dispatch) => {
  const url = `${apiUrl}/repositories`;
  return dispatch(get({
    url,
    params,
    key: SYNC_MANAGEMENT_REPOSITORIES_KEY,
  }));
};

export const getSyncStatus = (repositoryIds, params = {}) => (dispatch) => {
  const url = `${apiUrl}/sync_status`;
  return dispatch(get({
    url,
    params: { repository_ids: repositoryIds, ...params },
    key: SYNC_STATUS_KEY,
  }));
};

export const syncRepositories = (repositoryIds, params = {}) => (dispatch) => {
  const url = `${apiUrl}/sync`;
  return dispatch(post({
    url,
    params: { repository_ids: repositoryIds, ...params },
    key: SYNC_REPOSITORIES_KEY,
    successToast: response => `Started sync for ${response.data?.repositories?.length || 0} repositories`,
  }));
};

export const cancelSync = (repositoryId, params = {}) => (dispatch) => {
  const url = `${apiUrl}/cancel_sync`;
  return dispatch(del({
    url,
    params: { repository_id: repositoryId, ...params },
    successToast: 'Sync canceled',
  }));
};

export { getActionNameFromState };