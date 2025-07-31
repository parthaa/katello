import { selectKatello } from '../../../redux/index';

// Base selector for sync management state
export const selectSyncManagementState = state => selectKatello(state).syncManagement || {};

// Select all products with their repositories
export const selectProducts = state => selectSyncManagementState(state).products || [];

// Select expanded products
export const selectExpandedProducts = state => selectSyncManagementState(state).expandedProducts || {};

// Select selected repository IDs
export const selectSelectedRepositories = state => selectSyncManagementState(state).selectedRepositories || [];

// Select permissions
export const selectPermissions = state => selectSyncManagementState(state).permissions || {};

// Select organization info
export const selectOrganization = state => selectSyncManagementState(state).organization || {};

// Select loading states
export const selectIsLoading = state => selectSyncManagementState(state).loading || false;
export const selectIsSyncing = state => selectSyncManagementState(state).syncing || false;

// Select error messages
export const selectErrorMessage = state => selectSyncManagementState(state).error || null;

// Computed selectors
export const selectRedHatProducts = state =>
  selectProducts(state).filter(product => product.redhat);

export const selectCustomProducts = state =>
  selectProducts(state).filter(product => !product.redhat);

export const selectSyncableRepositories = state => {
  const products = selectProducts(state);
  const permissions = selectPermissions(state);
  
  if (!permissions.syncable) return [];
  
  return products.flatMap(product => 
    product.repositories.filter(repo => repo.id)
  );
};

export const selectRunningSyncs = state =>
  selectProducts(state).flatMap(product =>
    product.repositories.filter(repo => repo.is_running)
  );

export const selectHasRunningSyncs = state => selectRunningSyncs(state).length > 0;

export const selectTotalRepositories = state => {
  const products = selectProducts(state);
  return products.reduce((total, product) => total + product.repositories.length, 0);
};

export const selectSelectedRepositoryCount = state => selectSelectedRepositories(state).length;

export const selectCanSync = state => {
  const permissions = selectPermissions(state);
  const selectedRepos = selectSelectedRepositories(state);
  const isSyncing = selectIsSyncing(state);
  
  return permissions.syncable && selectedRepos.length > 0 && !isSyncing;
};

// Select product by ID
export const selectProductById = (state, productId) =>
  selectProducts(state).find(product => product.id === productId);

// Select repository by ID
export const selectRepositoryById = (state, repositoryId) => {
  const products = selectProducts(state);
  for (const product of products) {
    const repo = product.repositories.find(repo => repo.id === repositoryId);
    if (repo) return repo;
  }
  return null;
};

// Check if product is expanded
export const selectIsProductExpanded = (state, productId) => {
  const expandedProducts = selectExpandedProducts(state);
  return expandedProducts[productId] || false;
};

// Select repositories for a specific product
export const selectRepositoriesByProduct = (state, productId) => {
  const product = selectProductById(state, productId);
  return product ? product.repositories : [];
};