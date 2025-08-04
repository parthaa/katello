import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import HardwareModelsPage from '../HardwareModelsPage';

// Mock the TableIndexPage component
jest.mock('foremanReact/components/PF4/TableIndexPage/TableIndexPage', () => {
  return function MockTableIndexPage({ header, helpText }) {
    return (
      <div data-testid="table-index-page">
        <h1>{header}</h1>
        <p>{helpText}</p>
      </div>
    );
  };
});

// Mock the schema functions
jest.mock('../HardwareModelsTableSchema', () => ({
  getHardwareModelsColumns: () => ({}),
  getHardwareModelsSortParams: () => ({}),
  getHardwareModelsSearchProps: () => ({}),
  getApiConfig: () => ({
    key: 'HARDWARE_MODELS_TABLE',
    url: '/api/v2/models',
  }),
}));

describe('HardwareModelsPage', () => {
  beforeEach(() => {
    render(<HardwareModelsPage />);
  });

  it('should render hardware models page', () => {
    expect(screen.getByTestId('table-index-page')).toBeInTheDocument();
  });

  it('should display correct header', () => {
    expect(screen.getByText('Hardware Models')).toBeInTheDocument();
  });

  it('should display help text', () => {
    expect(screen.getByText(/Manage hardware models for your hosts/)).toBeInTheDocument();
  });
});