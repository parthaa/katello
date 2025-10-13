import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RedHatRepositoriesPage from '../RedHatRepositoriesPage';

jest.mock('foremanReact/components/PermissionDenied', () => ({ missingPermissions }) => (
  <div data-testid="permission-denied">
    Permission Denied: {missingPermissions.join(', ')}
  </div>
));

jest.mock('../components/SearchBar', () => () => <div data-testid="search-bar">SearchBar</div>);
jest.mock('../components/RecommendedRepositorySetsToggler', () => () => <div>Toggler</div>);
jest.mock('../../components/LoadingState', () => ({ children, loading }) => (
  loading ? <div>Loading...</div> : <div>{children}</div>
));

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

  it('should render the main page structure', () => {
    render(<RedHatRepositoriesPage {...defaultProps} />);

    expect(screen.getByText('Red Hat Repositories')).toBeInTheDocument();
    expect(screen.getByText('Available Repositories')).toBeInTheDocument();
    expect(screen.getByText('Enabled Repositories')).toBeInTheDocument();
    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
  });

  it('should render PermissionDenied when permissions are missing', () => {
    const props = {
      ...defaultProps,
      enabledRepositories: {
        ...defaultProps.enabledRepositories,
        missingPermissions: ['view_organizations'],
      },
      repositorySets: {
        ...defaultProps.repositorySets,
        missingPermissions: ['view_organizations'],
      },
    };

    render(<RedHatRepositoriesPage {...props} />);

    expect(screen.getByTestId('permission-denied')).toBeInTheDocument();
    expect(screen.getByText(/view_organizations/)).toBeInTheDocument();
  });
});
