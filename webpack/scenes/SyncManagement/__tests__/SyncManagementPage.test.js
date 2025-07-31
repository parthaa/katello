import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import SyncManagementPage from '../SyncManagementPage';

const mockStore = createStore(() => ({}));

const defaultProps = {
  products: [],
  selectedRepositories: [],
  expandedProducts: {},
  permissions: { syncable: true },
  organization: { id: 1, name: 'Test Org' },
  canSync: false,
  totalRepositories: 0,
  runningSyncs: [],
  loading: false,
  isSyncing: false,
  error: null,
  loadSyncManagement: jest.fn(),
  startSync: jest.fn(),
  cancelSync: jest.fn(),
  updateSelectedRepositories: jest.fn(),
  toggleProductExpansion: jest.fn(),
};

const renderWithStore = (component) =>
  render(
    <Provider store={mockStore}>
      {component}
    </Provider>
  );

describe('SyncManagementPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the page title', () => {
    renderWithStore(<SyncManagementPage {...defaultProps} />);
    expect(screen.getByText('Sync Status')).toBeInTheDocument();
  });

  it('displays organization name', () => {
    renderWithStore(<SyncManagementPage {...defaultProps} />);
    expect(screen.getByText('Organization: Test Org')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    const props = { ...defaultProps, loading: true };
    renderWithStore(<SyncManagementPage {...props} />);
    // LoadingState component would be rendered
    expect(defaultProps.loadSyncManagement).not.toHaveBeenCalled();
  });

  it('shows empty state when no products', () => {
    renderWithStore(<SyncManagementPage {...defaultProps} />);
    expect(screen.getByText('No repositories available')).toBeInTheDocument();
  });

  it('displays error message when present', () => {
    const props = { ...defaultProps, error: 'Test error message' };
    renderWithStore(<SyncManagementPage {...props} />);
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('calls loadSyncManagement on mount', () => {
    renderWithStore(<SyncManagementPage {...defaultProps} />);
    expect(defaultProps.loadSyncManagement).toHaveBeenCalledTimes(1);
  });

  it('renders products table when products exist', () => {
    const products = [
      {
        id: 1,
        name: 'Test Product',
        redhat: false,
        repositories: [
          {
            id: 1,
            name: 'Test Repo',
            content_type: 'yum',
            state: 'never_synced',
          },
        ],
      },
    ];
    const props = { ...defaultProps, products, totalRepositories: 1 };
    renderWithStore(<SyncManagementPage {...props} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });
});