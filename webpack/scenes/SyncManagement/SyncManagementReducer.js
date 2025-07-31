import Immutable from 'seamless-immutable';
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
} from './SyncManagementConstants';

const initialState = Immutable({
  products: [],
  permissions: {},
  organization: {},
  selectedRepositories: [],
  expandedProducts: {},
  loading: false,
  syncing: false,
  error: null,
});

const updateRepositoryStatus = (products, statusUpdates) => {
  if (!Array.isArray(statusUpdates)) return products;

  return products.map(product => ({
    ...product,
    repositories: product.repositories.map(repo => {
      const update = statusUpdates.find(status => status.id === repo.id);
      return update ? { ...repo, ...update } : repo;
    }),
  }));
};

export default (state = initialState, action) => {
  switch (action.type) {
    case SYNC_MANAGEMENT_REQUEST:
      return state.merge({
        loading: true,
        error: null,
      });

    case SYNC_MANAGEMENT_SUCCESS:
      return state.merge({
        loading: false,
        products: action.payload.products || [],
        permissions: action.payload.permissions || {},
        organization: action.payload.organization || {},
        error: null,
      });

    case SYNC_MANAGEMENT_FAILURE:
      return state.merge({
        loading: false,
        error: action.payload,
      });

    case SYNC_STATUS_REQUEST:
      return state;

    case SYNC_STATUS_SUCCESS:
      return state.merge({
        products: updateRepositoryStatus(state.products, action.payload),
      });

    case SYNC_STATUS_FAILURE:
      return state.merge({
        error: action.payload,
      });

    case START_SYNC_REQUEST:
      return state.merge({
        syncing: true,
        error: null,
      });

    case START_SYNC_SUCCESS:
      return state.merge({
        syncing: false,
        products: updateRepositoryStatus(state.products, action.payload),
      });

    case START_SYNC_FAILURE:
      return state.merge({
        syncing: false,
        error: action.payload,
      });

    case CANCEL_SYNC_REQUEST:
      return state;

    case CANCEL_SYNC_SUCCESS:
      return state.merge({
        products: state.products.map(product => ({
          ...product,
          repositories: product.repositories.map(repo =>
            repo.id === action.payload.repositoryId
              ? { ...repo, raw_state: 'canceled', is_running: false }
              : repo
          ),
        })),
      });

    case CANCEL_SYNC_FAILURE:
      return state.merge({
        error: action.payload,
      });

    case UPDATE_SELECTED_REPOSITORIES:
      return state.merge({
        selectedRepositories: action.payload,
      });

    case TOGGLE_PRODUCT_EXPANSION: {
      const productId = action.payload;
      const currentExpanded = state.expandedProducts[productId] || false;
      
      return state.merge({
        expandedProducts: {
          ...state.expandedProducts,
          [productId]: !currentExpanded,
        },
      });
    }

    default:
      return state;
  }
};