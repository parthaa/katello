import React from 'react';
import { render, screen } from '@testing-library/react';
import RedHatRepositoriesPage from '../RedHatRepositoriesPage';

// Mock the PermissionDenied component
jest.mock('foremanReact/components/PermissionDenied', () => {
  return function PermissionDenied({ missingPermissions }) {
    return (
      <div data-testid="permission-denied">
        Permission Denied: {missingPermissions.join(', ')}
      </div>
    );
  };
});

// Mock the SearchBar component
jest.mock('../components/SearchBar', () => {
  return function SearchBar() {
    return <div data-testid="search-bar">Search Bar</div>;
  };
});

// Mock the RecommendedRepositorySetsToggler component
jest.mock('../components/RecommendedRepositorySetsToggler', () => {
  return function RecommendedRepositorySetsToggler({ enabled, children, onChange, className }) {
    return (
      <div data-testid="recommended-toggler" className={className}>
        <label>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onChange(e.target.checked)}
          />
          {children}
        </label>
      </div>
    );
  };
});

// Mock the LoadingState component
jest.mock('../../../components/LoadingState', () => ({
  LoadingState: function LoadingState({ loading, loadingText, children }) {
    if (loading) {
      return <div data-testid="loading-state">{loadingText}</div>;
    }
    return children;
  }
}));

// Mock the helpers that return components
jest.mock('../helpers', () => ({
  getSetsComponent: jest.fn(() => (
    <div data-testid="repository-sets">
      <p dangerouslySetInnerHTML={{
        __html: 'No Red Hat products currently exist, please import a manifest <a href="/subscriptions/"> here </a> to receive Red Hat content. No repository sets available.'
      }} />
    </div>
  )),
  getEnabledComponent: jest.fn(() => (
    <div data-testid="enabled-repositories">
      <div data-testid="pagination">Pagination component</div>
    </div>
  ))
}));

// Mock the API service
jest.mock('../../../services/api', () => ({
  open: jest.fn()
}));

// Mock the CDN configuration constants
jest.mock('../../Subscriptions/Manifest/CdnConfigurationTab/CdnConfigurationConstants', () => ({
  EXPORT_SYNC: 'export_sync'
}));

// Mock the Redux action creator
jest.mock('../../../redux/actions/RedHatRepositories/enabled', () => ({
  createEnabledRepoParams: jest.fn(() => ({ repoParams: {} }))
}));

describe('RedHatRepositories page', () => {
  const defaultProps = {
    loadEnabledRepos: jest.fn(),
    loadRepositorySets: jest.fn(),
    loadOrganization: jest.fn(),
    updateRecommendedRepositorySets: jest.fn(),
    enabledRepositories: {
      loading: false,
      search: {},
      missingPermissions: [],
      repositories: [],
    },
    repositorySets: {
      recommended: false,
      loading: false,
      search: {},
      missingPermissions: [],
    },
    organization: {
      id: 1000,
      cdn_configuration: {
        type: 'redhat_cdn',
        url: 'http://cdn.example.com',
      },
    },
  };

  const permissionDeniedProps = {
    ...defaultProps,
    enabledRepositories: {
      loading: false,
      search: {},
      missingPermissions: ['view_organizations'],
    },
    repositorySets: {
      recommended: false,
      loading: false,
      search: {},
      missingPermissions: ['view_organizations'],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    test('should render normal page layout', () => {
      const { container } = render(<RedHatRepositoriesPage {...defaultProps} />);

      // Verify component renders without crashing
      expect(container.firstChild).toBeInTheDocument();

      // Verify main page structure
      expect(screen.getByText('Red Hat Repositories')).toBeInTheDocument();
      expect(screen.getByText('Available Repositories')).toBeInTheDocument();
      expect(screen.getByText('Enabled Repositories')).toBeInTheDocument();

      // Verify search bar is present
      expect(screen.getByTestId('search-bar')).toBeInTheDocument();

      // Verify recommended repositories toggler
      expect(screen.getByTestId('recommended-toggler')).toBeInTheDocument();
      expect(screen.getByText('Recommended Repositories')).toBeInTheDocument();

      // Verify export CSV button
      expect(screen.getByRole('button', { name: /export as csv/i })).toBeInTheDocument();

      // Verify help text for enabled repositories
      expect(screen.getByText(/only repositories not published in a content view can be disabled/i)).toBeInTheDocument();

      // Verify repository sets component is rendered
      expect(screen.getByTestId('repository-sets')).toBeInTheDocument();
      expect(screen.getByTestId('enabled-repositories')).toBeInTheDocument();

      // Verify the no products message is displayed
      expect(screen.getByText(/no red hat products currently exist/i)).toBeInTheDocument();
      expect(screen.getByText(/import a manifest/i)).toBeInTheDocument();
    });

    test('should render PermissionDenied when permissions are missing', () => {
      render(<RedHatRepositoriesPage {...permissionDeniedProps} />);

      // Verify PermissionDenied component is rendered
      expect(screen.getByTestId('permission-denied')).toBeInTheDocument();
      expect(screen.getByText('Permission Denied: view_organizations')).toBeInTheDocument();

      // Verify normal page content is not rendered
      expect(screen.queryByText('Red Hat Repositories')).not.toBeInTheDocument();
      expect(screen.queryByText('Available Repositories')).not.toBeInTheDocument();
    });

    test('should render loading skeleton when organization has no CDN configuration', () => {
      const propsWithoutCDN = {
        ...defaultProps,
        organization: {
          id: 1000,
          // No cdn_configuration
        }
      };

      const { container } = render(<RedHatRepositoriesPage {...propsWithoutCDN} />);

      // Verify skeleton is rendered (PatternFly Skeleton component)
      expect(container.querySelector('.pf-c-skeleton')).toBeInTheDocument();

      // Verify normal page content is not rendered
      expect(screen.queryByText('Red Hat Repositories')).not.toBeInTheDocument();
    });

    test('should render Export Sync alert when CDN is configured for export sync', () => {
      const exportSyncProps = {
        ...defaultProps,
        organization: {
          id: 1000,
          cdn_configuration: {
            type: 'export_sync', // Export sync mode
            url: 'http://cdn.example.com',
          },
        }
      };

      render(<RedHatRepositoriesPage {...exportSyncProps} />);

      // Verify the page still has the title
      expect(screen.getByText('Red Hat Repositories')).toBeInTheDocument();

      // Verify the export sync alert is displayed
      expect(screen.getByText(/cdn configuration is set to export sync/i)).toBeInTheDocument();
      expect(screen.getByText(/repository enablement\/disablement is not permitted/i)).toBeInTheDocument();

      // Verify normal repository sections are not rendered
      expect(screen.queryByText('Available Repositories')).not.toBeInTheDocument();
      expect(screen.queryByText('Enabled Repositories')).not.toBeInTheDocument();
    });

    test('should call lifecycle methods on mount', () => {
      const mockProps = {
        ...defaultProps,
        loadEnabledRepos: jest.fn(),
        loadRepositorySets: jest.fn(),
        loadOrganization: jest.fn(),
      };

      render(<RedHatRepositoriesPage {...mockProps} />);

      // Verify that the lifecycle methods are called
      expect(mockProps.loadOrganization).toHaveBeenCalledTimes(1);
      expect(mockProps.loadEnabledRepos).toHaveBeenCalledTimes(1);
      expect(mockProps.loadRepositorySets).toHaveBeenCalledWith({ search: { filters: ['rpm'] } });
    });

    test('should handle loading states', () => {
      const loadingProps = {
        ...defaultProps,
        enabledRepositories: {
          ...defaultProps.enabledRepositories,
          loading: true,
        },
        repositorySets: {
          ...defaultProps.repositorySets,
          loading: true,
        }
      };

      render(<RedHatRepositoriesPage {...loadingProps} />);

      // Verify loading states are shown
      const loadingStates = screen.getAllByTestId('loading-state');
      expect(loadingStates).toHaveLength(2); // One for each section

      // Verify loading text
      expect(screen.getAllByText('Loading')).toHaveLength(2);
    });

    test('should handle recommended repositories toggler state', () => {
      const recommendedProps = {
        ...defaultProps,
        repositorySets: {
          ...defaultProps.repositorySets,
          recommended: true, // Recommended is enabled
        }
      };

      render(<RedHatRepositoriesPage {...recommendedProps} />);

      // Verify the toggler reflects the enabled state
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });

    test('should have correct CSS classes and structure', () => {
      render(<RedHatRepositoriesPage {...defaultProps} />);

      // Verify container has correct ID
      expect(screen.getByText('Red Hat Repositories').closest('#redhatRepositoriesPage')).toBeInTheDocument();

      // Verify column containers have correct classes
      expect(document.querySelector('.available-repositories-container')).toBeInTheDocument();
      expect(document.querySelector('.enabled-repositories-container')).toBeInTheDocument();
      expect(document.querySelector('.recommended-repositories-toggler')).toBeInTheDocument();
    });
  });
});
