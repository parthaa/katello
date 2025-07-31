import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import SyncManagementTablePage from '../SyncManagementTablePage';

// Mock the TableIndexPage component since it requires complex setup
jest.mock('foremanReact/components/PF4/TableIndexPage/TableIndexPage', () => {
  return function MockTableIndexPage({ header, helpText, children }) {
    return (
      <div data-testid="table-index-page">
        <h1>{header}</h1>
        <p>{helpText}</p>
        {children}
      </div>
    );
  };
});

// Mock the API service
jest.mock('../../../services/api', () => ({
  delete: jest.fn(),
  post: jest.fn(),
}));

const renderWithRouter = (component) =>
  render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );

describe('SyncManagementTablePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the table index page with correct header', () => {
    renderWithRouter(<SyncManagementTablePage />);
    
    expect(screen.getByTestId('table-index-page')).toBeInTheDocument();
    expect(screen.getByText('Sync Status')).toBeInTheDocument();
  });

  it('displays help text', () => {
    renderWithRouter(<SyncManagementTablePage />);
    
    expect(screen.getByText(
      'Manage repository synchronization status and sync repositories.'
    )).toBeInTheDocument();
  });

  it('renders without crashing', () => {
    renderWithRouter(<SyncManagementTablePage />);
    
    // Component should render without throwing
    expect(screen.getByTestId('table-index-page')).toBeInTheDocument();
  });
});