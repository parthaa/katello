export const SYNC_MANAGEMENT = 'SYNC_MANAGEMENT';

// Action types
export const SYNC_MANAGEMENT_REQUEST = 'SYNC_MANAGEMENT_REQUEST';
export const SYNC_MANAGEMENT_SUCCESS = 'SYNC_MANAGEMENT_SUCCESS';
export const SYNC_MANAGEMENT_FAILURE = 'SYNC_MANAGEMENT_FAILURE';

export const SYNC_STATUS_REQUEST = 'SYNC_STATUS_REQUEST';
export const SYNC_STATUS_SUCCESS = 'SYNC_STATUS_SUCCESS';
export const SYNC_STATUS_FAILURE = 'SYNC_STATUS_FAILURE';

export const START_SYNC_REQUEST = 'START_SYNC_REQUEST';
export const START_SYNC_SUCCESS = 'START_SYNC_SUCCESS';
export const START_SYNC_FAILURE = 'START_SYNC_FAILURE';

export const CANCEL_SYNC_REQUEST = 'CANCEL_SYNC_REQUEST';
export const CANCEL_SYNC_SUCCESS = 'CANCEL_SYNC_SUCCESS';
export const CANCEL_SYNC_FAILURE = 'CANCEL_SYNC_FAILURE';

export const UPDATE_SELECTED_REPOSITORIES = 'UPDATE_SELECTED_REPOSITORIES';
export const TOGGLE_PRODUCT_EXPANSION = 'TOGGLE_PRODUCT_EXPANSION';

// Sync status values
export const SYNC_STATUS = {
  STOPPED: 'stopped',
  ERROR: 'error',
  NEVER_SYNCED: 'never_synced',
  RUNNING: 'running',
  CANCELED: 'canceled',
  PAUSED: 'paused',
};

// Content types
export const CONTENT_TYPES = {
  YUM: 'yum',
  DOCKER: 'docker',
  OSTREE: 'ostree',
  FILE: 'file',
  ANSIBLE_COLLECTION: 'ansible_collection',
  DEB: 'deb',
  PYTHON: 'python',
};

// API paths
export const API_PATHS = {
  SYNC_MANAGEMENT: '/katello/sync_management',
  SYNC_STATUS: '/katello/sync_management/sync_status',
  START_SYNC: '/katello/sync_management/sync',
  CANCEL_SYNC: (repoId) => `/katello/sync_management/${repoId}`,
};

// Polling intervals
export const POLLING_INTERVAL = 5000; // 5 seconds
export const MAX_POLLING_ATTEMPTS = 360; // 30 minutes at 5-second intervals