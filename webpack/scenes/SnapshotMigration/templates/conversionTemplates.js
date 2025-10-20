/**
 * Test Conversion Templates
 *
 * Pre-defined templates for converting common Enzyme test patterns
 * to React Testing Library equivalents
 */

/**
 * Template for basic component rendering test
 */
export const basicRenderingTemplate = (componentName, props = {}) => `
import React from 'react';
import { render, screen } from '@testing-library/react';
import ${componentName} from '../${componentName}';

describe('${componentName}', () => {
  test('renders without crashing', () => {
    const props = ${JSON.stringify(props, null, 4)};

    const { container } = render(<${componentName} {...props} />);

    expect(container.firstChild).toBeInTheDocument();
  });
});`;

/**
 * Template for table component tests
 */
export const tableComponentTemplate = (componentName, props = {}) => `
import React from 'react';
import { render, screen } from '@testing-library/react';
import ${componentName} from '../${componentName}';

describe('${componentName}', () => {
  const defaultProps = ${JSON.stringify(props, null, 4)};

  test('renders table with correct structure', () => {
    render(<${componentName} {...defaultProps} />);

    // Test for table presence
    expect(screen.getByRole('table')).toBeInTheDocument();

    // Test for table headers if applicable
    // expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();

    // Test for table rows if data is provided
    // expect(screen.getAllByRole('row')).toHaveLength(expectedRowCount);
  });

  test('displays correct data', () => {
    render(<${componentName} {...defaultProps} />);

    // Add specific assertions for your data
    // Example: expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});`;

/**
 * Template for modal component tests
 */
export const modalComponentTemplate = (componentName, props = {}) => `
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ${componentName} from '../${componentName}';

describe('${componentName}', () => {
  const defaultProps = ${JSON.stringify({ isOpen: true, ...props }, null, 4)};

  test('renders when open', () => {
    render(<${componentName} {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    render(<${componentName} {...defaultProps} isOpen={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('can be closed by close button', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(<${componentName} {...defaultProps} onClose={onClose} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});`;

/**
 * Template for form component tests
 */
export const formComponentTemplate = (componentName, props = {}) => `
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ${componentName} from '../${componentName}';

describe('${componentName}', () => {
  const defaultProps = ${JSON.stringify(props, null, 4)};

  test('renders form elements', () => {
    render(<${componentName} {...defaultProps} />);

    expect(screen.getByRole('form')).toBeInTheDocument();

    // Add specific form field assertions
    // Example: expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
  });

  test('handles form submission', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    render(<${componentName} {...defaultProps} onSubmit={onSubmit} />);

    // Fill form fields
    // Example: await user.type(screen.getByLabelText(/name/i), 'Test Name');

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  test('validates required fields', async () => {
    const user = userEvent.setup();

    render(<${componentName} {...defaultProps} />);

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    // Add validation assertions
    // Example: expect(screen.getByText(/name is required/i)).toBeInTheDocument();
  });
});`;

/**
 * Template for Redux-connected component tests
 */
export const reduxComponentTemplate = (componentName, props = {}) => `
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import ${componentName} from '../${componentName}';

// Mock reducer for testing
const mockReducer = (state = {}, action) => {
  switch (action.type) {
    default:
      return state;
  }
};

const renderWithRedux = (component, initialState = {}) => {
  const store = createStore(mockReducer, initialState);
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('${componentName}', () => {
  const defaultProps = ${JSON.stringify(props, null, 4)};
  const initialState = {
    // Add your initial state here
  };

  test('renders with Redux store', () => {
    renderWithRedux(<${componentName} {...defaultProps} />, initialState);

    expect(screen.getByTestId('${componentName.toLowerCase()}')).toBeInTheDocument();
  });

  test('displays data from Redux store', () => {
    const stateWithData = {
      ...initialState,
      // Add test data
    };

    renderWithRedux(<${componentName} {...defaultProps} />, stateWithData);

    // Add assertions for Redux data
    // Example: expect(screen.getByText('Data from Redux')).toBeInTheDocument();
  });
});`;

/**
 * Template for API-connected component tests
 */
export const apiComponentTemplate = (componentName, props = {}) => `
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import ${componentName} from '../${componentName}';

// Mock API server
const server = setupServer(
  rest.get('/api/test-endpoint', (req, res, ctx) => {
    return res(ctx.json({ data: 'mock data' }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('${componentName}', () => {
  const defaultProps = ${JSON.stringify(props, null, 4)};

  test('renders loading state initially', () => {
    render(<${componentName} {...defaultProps} />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('renders data after API call', async () => {
    render(<${componentName} {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('mock data')).toBeInTheDocument();
    });
  });

  test('handles API errors', async () => {
    server.use(
      rest.get('/api/test-endpoint', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    render(<${componentName} {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});`;

/**
 * Get appropriate template based on component analysis
 */
export const getTemplate = (componentName, componentType, props = {}) => {
  switch (componentType) {
    case 'table':
      return tableComponentTemplate(componentName, props);
    case 'modal':
      return modalComponentTemplate(componentName, props);
    case 'form':
      return formComponentTemplate(componentName, props);
    case 'redux':
      return reduxComponentTemplate(componentName, props);
    case 'api':
      return apiComponentTemplate(componentName, props);
    default:
      return basicRenderingTemplate(componentName, props);
  }
};

/**
 * Detect component type based on props and snapshot content
 */
export const detectComponentType = (snapshotContent, testAnalysis) => {
  if (snapshotContent.includes('Modal') || snapshotContent.includes('dialog')) {
    return 'modal';
  }

  if (snapshotContent.includes('Table') || snapshotContent.includes('tbody')) {
    return 'table';
  }

  if (snapshotContent.includes('form') || snapshotContent.includes('Form')) {
    return 'form';
  }

  if (testAnalysis?.imports?.some(imp => imp.includes('redux'))) {
    return 'redux';
  }

  if (testAnalysis?.imports?.some(imp => imp.includes('api') || imp.includes('fetch'))) {
    return 'api';
  }

  return 'basic';
};

/**
 * Generate a complete RTL test file from Enzyme snapshot
 */
export const generateRTLTestFromSnapshot = (snapshotData, testAnalysis) => {
  // Extract component name from test file path
  const fileName = snapshotData.testFilePath.split('/').pop();
  const componentName = fileName.replace(/\.test\.js$/, '');

  // Detect component type
  const componentType = detectComponentType(
    snapshotData.snapshots[0]?.snapshot || '',
    testAnalysis
  );

  // Extract props from snapshot if possible
  const props = extractPropsFromSnapshot(snapshotData.snapshots[0]?.snapshot || '');

  return getTemplate(componentName, componentType, props);
};

/**
 * Extract props from snapshot content (basic implementation)
 */
const extractPropsFromSnapshot = (snapshotContent) => {
  const props = {};

  // Extract common props patterns
  const propMatches = snapshotContent.match(/(\w+)=\{([^}]+)\}/g);
  if (propMatches) {
    propMatches.forEach(match => {
      const [, key, value] = match.match(/(\w+)=\{([^}]+)\}/);
      if (value === 'true' || value === 'false') {
        props[key] = value === 'true';
      } else if (/^\d+$/.test(value)) {
        props[key] = parseInt(value, 10);
      } else if (value.startsWith('"') && value.endsWith('"')) {
        props[key] = value.slice(1, -1);
      }
    });
  }

  return props;
};

export default {
  basicRenderingTemplate,
  tableComponentTemplate,
  modalComponentTemplate,
  formComponentTemplate,
  reduxComponentTemplate,
  apiComponentTemplate,
  getTemplate,
  detectComponentType,
  generateRTLTestFromSnapshot,
};