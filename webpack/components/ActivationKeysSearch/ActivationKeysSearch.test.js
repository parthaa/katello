import React from 'react';
import { renderWithRedux } from 'react-testing-lib-wrapper';
import { waitFor } from '@testing-library/react';
import { nockInstance, assertNockRequest } from '../../test-utils/nockWrapper';
import ActivationKeysSearch from './index';

describe('ActivationKeysSearch', () => {
  beforeEach(() => {
    jest.spyOn(document, 'querySelector').mockImplementation((selector) => {
      if (selector === '#hostgroup_content_view_environment_id') {
        return { value: '5' };
      }
      return null;
    });
  });

  afterEach(() => {
    document.querySelector.mockRestore();
  });

  it('renders without crashing', async () => {
    const cveScope = nockInstance
      .get('/katello/api/v2/content_view_environments/5')
      .reply(200, {
        id: 5,
        content_view: { id: 2, name: 'Default' },
        lifecycle_environment: { id: 1, name: 'Library' },
        activation_keys: [{ id: 1, name: 'test-key', label: 'test-key' }],
      });

    const { getByText } = renderWithRedux(<ActivationKeysSearch />, {});

    await waitFor(() => {
      expect(getByText('Activation Key information')).toBeInTheDocument();
    });

    assertNockRequest(cveScope);
  });

  it('shows empty state when no content view environment is selected', () => {
    document.querySelector.mockImplementation(() => null);

    const { getByText } = renderWithRedux(<ActivationKeysSearch />, {});
    expect(
      getByText('Please select a lifecycle environment and content view to view activation keys.')
    ).toBeInTheDocument();
  });
});
