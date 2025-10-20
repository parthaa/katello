import React from 'react';
import { render, screen } from '@testing-library/react';
import ModuleStreamDetailProfiles from '../ModuleStreamDetailProfiles';
import { details } from '../../__tests__/moduleStreamDetails.fixtures';

describe('Module stream detail profiles component', () => {
  describe('rendering', () => {
    test('renders with profiles', () => {
      const profiles = details.profiles;

      const { container } = render(
        <ModuleStreamDetailProfiles profiles={profiles} />
      );

      // Verify component renders without crashing
      expect(container.firstChild).toBeInTheDocument();

      // Verify table headers are present
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('RPMs')).toBeInTheDocument();

      // Verify profile data is displayed
      profiles.forEach((profile) => {
        expect(screen.getByText(profile.name)).toBeInTheDocument();
      });

      // Verify specific profile names from the fixture
      expect(screen.getByText('default')).toBeInTheDocument();
      expect(screen.getByText('minimal')).toBeInTheDocument();

      // Verify RPM data is rendered (ProfileRpmsCellFormatter should display RPMs)
      // The RPM names should be visible in the document through the cell formatter
      // Note: RPMs are rendered as comma-separated text, so we need to use partial text matching
      expect(screen.getByText(/perl/)).toBeInTheDocument();
      expect(screen.getByText(/foo/)).toBeInTheDocument();
      expect(screen.getByText('python2-avocado')).toBeInTheDocument();

      // Verify we have the expected number of profiles
      expect(profiles).toHaveLength(2);

      // Verify the default profile has multiple RPMs
      const defaultProfile = profiles.find(p => p.name === 'default');
      expect(defaultProfile.rpms).toHaveLength(13);

      // Verify the minimal profile has one RPM
      const minimalProfile = profiles.find(p => p.name === 'minimal');
      expect(minimalProfile.rpms).toHaveLength(1);

      // Verify the RPMs are rendered in comma-separated format for the default profile
      // This tests the ProfileRpmsCellFormatter behavior
      expect(screen.getByText(/perl, foo, rpm_0/)).toBeInTheDocument();
    });

    test('renders empty state when no profiles provided', () => {
      const { container } = render(
        <ModuleStreamDetailProfiles profiles={[]} />
      );

      // Component should still render
      expect(container.firstChild).toBeInTheDocument();

      // Headers should still be present
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('RPMs')).toBeInTheDocument();

      // No profile data should be present
      expect(screen.queryByText('default')).not.toBeInTheDocument();
      expect(screen.queryByText('minimal')).not.toBeInTheDocument();
    });

    test('renders with single profile', () => {
      const singleProfile = [details.profiles[0]]; // Just the 'default' profile

      render(<ModuleStreamDetailProfiles profiles={singleProfile} />);

      // Verify single profile is rendered
      expect(screen.getByText('default')).toBeInTheDocument();
      expect(screen.queryByText('minimal')).not.toBeInTheDocument();

      // Verify some RPMs from the default profile are shown
      expect(screen.getByText(/perl/)).toBeInTheDocument();
      expect(screen.getByText(/foo/)).toBeInTheDocument();
    });

    test('renders profile structure correctly', () => {
      const testProfile = {
        id: 99,
        name: 'test-profile',
        rpms: [
          { id: 1, name: 'test-rpm-1' },
          { id: 2, name: 'test-rpm-2' },
        ]
      };

      render(<ModuleStreamDetailProfiles profiles={[testProfile]} />);

      // Verify the test profile and its RPMs are rendered
      expect(screen.getByText('test-profile')).toBeInTheDocument();

      // RPMs are rendered as comma-separated text by ProfileRpmsCellFormatter
      expect(screen.getByText(/test-rpm-1/)).toBeInTheDocument();
      expect(screen.getByText(/test-rpm-2/)).toBeInTheDocument();

      // Also verify they appear together in the expected format
      expect(screen.getByText('test-rpm-1, test-rpm-2')).toBeInTheDocument();
    });
  });
});