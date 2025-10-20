/**
 * Snapshot Migration Tool Tests
 *
 * Tests for the snapshot migration utilities
 */

import snapshotFileUtils from '../utils/snapshotFileUtils';
import testConversionUtils from '../utils/testConversionUtils';
import conversionTemplates from '../templates/conversionTemplates';

// Mock fs module for testing
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    unlink: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn(),
    rmdir: jest.fn(),
  }
}));

describe('Snapshot Migration Utils', () => {
  describe('testConversionUtils', () => {
    test('convertImports removes enzyme imports and adds RTL imports', () => {
      const content = `
import React from 'react';
import { shallow, mount } from 'enzyme';
import toJson from 'enzyme-to-json';
import MyComponent from '../MyComponent';
`;

      const result = testConversionUtils.convertImports(content);

      expect(result).not.toContain('enzyme');
      expect(result).not.toContain('enzyme-to-json');
      expect(result).toContain('@testing-library/react');
    });

    test('convertRenderCalls replaces shallow with render', () => {
      const content = `
const wrapper = shallow(<MyComponent prop="value" />);
`;

      const result = testConversionUtils.convertRenderCalls(content);

      expect(result).not.toContain('shallow');
      expect(result).toContain('const { container } = render(<MyComponent prop="value" />);');
    });

    test('convertSnapshotAssertions removes snapshot tests', () => {
      const content = `
expect(toJson(wrapper)).toMatchSnapshot();
expect(wrapper.find('div')).toHaveLength(1);
`;

      const result = testConversionUtils.convertSnapshotAssertions(content, { removeSnapshots: true });

      expect(result).not.toContain('toMatchSnapshot');
      expect(result).not.toContain('toJson');
      expect(result).toContain("expect(wrapper.find('div')).toHaveLength(1);");
    });

    test('convertFinderMethods replaces find calls with RTL queries', () => {
      const content = `
expect(wrapper.find(Button)).toHaveLength(1);
expect(wrapper.find(Table)).toHaveLength(0);
`;

      const result = testConversionUtils.convertFinderMethods(content);

      expect(result).toContain("expect(screen.getByTestId('button')).toBeInTheDocument()");
      expect(result).toContain("expect(screen.queryByTestId('table')).not.toBeInTheDocument()");
    });

    test('generateMigrationSuggestions creates appropriate suggestions', () => {
      const testAnalysis = {
        usesEnzyme: true,
        usesSnapshots: true,
        usesShallow: true,
        usesRTL: false
      };

      const suggestions = testConversionUtils.generateMigrationSuggestions(testAnalysis);

      expect(suggestions).toHaveLength(3);
      expect(suggestions.some(s => s.type === 'import_conversion')).toBe(true);
      expect(suggestions.some(s => s.type === 'snapshot_removal')).toBe(true);
      expect(suggestions.some(s => s.type === 'shallow_replacement')).toBe(true);
    });
  });

  describe('conversionTemplates', () => {
    test('detectComponentType identifies table components', () => {
      const snapshotContent = '<Table><tbody><tr><td>Test</td></tr></tbody></Table>';
      const type = conversionTemplates.detectComponentType(snapshotContent, {});

      expect(type).toBe('table');
    });

    test('detectComponentType identifies modal components', () => {
      const snapshotContent = '<Modal isOpen={true}><div>Modal content</div></Modal>';
      const type = conversionTemplates.detectComponentType(snapshotContent, {});

      expect(type).toBe('modal');
    });

    test('detectComponentType identifies form components', () => {
      const snapshotContent = '<form><input type="text" /></form>';
      const type = conversionTemplates.detectComponentType(snapshotContent, {});

      expect(type).toBe('form');
    });

    test('getTemplate returns appropriate template for component type', () => {
      const tableTemplate = conversionTemplates.getTemplate('MyTable', 'table');
      const modalTemplate = conversionTemplates.getTemplate('MyModal', 'modal');

      expect(tableTemplate).toContain('getByRole(\'table\')');
      expect(modalTemplate).toContain('getByRole(\'dialog\')');
    });
  });

  describe('Integration Tests', () => {
    test('full conversion workflow processes test file correctly', async () => {
      const originalContent = `
import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  test('renders correctly', () => {
    const wrapper = shallow(<MyComponent />);
    expect(toJson(wrapper)).toMatchSnapshot();
    expect(wrapper.find('div')).toHaveLength(1);
  });
});`;

      const result = await testConversionUtils.convertTestFile(originalContent, {
        removeSnapshots: true,
        addBehaviorTests: true
      });

      expect(result.convertedContent).toContain('@testing-library/react');
      expect(result.convertedContent).not.toContain('enzyme');
      expect(result.convertedContent).not.toContain('toMatchSnapshot');
      expect(result.convertedContent).toContain('container.firstChild').toBeInTheDocument();
      expect(result.changes.importsUpdated).toBe(true);
      expect(result.changes.snapshotsRemoved).toBe(true);
    });
  });
});

describe('CLI Interface', () => {
  test('analyzeProject returns migration report', async () => {
    // Mock the file system calls
    const fs = require('fs');
    fs.promises.readdir.mockResolvedValue(['__snapshots__']);
    fs.promises.stat.mockResolvedValue({ isDirectory: () => true });

    // This would require actual file system setup for full testing
    // For now, just test the interface exists
    expect(typeof snapshotFileUtils.findSnapshotFiles).toBe('function');
    expect(typeof snapshotFileUtils.generateMigrationReport).toBe('function');
  });
});