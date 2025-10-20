/**
 * Test Conversion Utilities
 *
 * Utilities for converting Enzyme-based snapshot tests to React Testing Library
 * with proper assertions and improved testing practices
 */

/**
 * Convert Enzyme imports to React Testing Library imports
 */
export const convertImports = (content) => {
  let newContent = content;

  // Remove enzyme imports
  newContent = newContent.replace(/import\s+{\s*shallow,?\s*mount?\s*}\s+from\s+['"]enzyme['"];\s*\n?/g, '');
  newContent = newContent.replace(/import\s+toJson\s+from\s+['"]enzyme-to-json['"];\s*\n?/g, '');

  // Add React Testing Library imports if not present
  if (!newContent.includes('@testing-library/react')) {
    const reactImportMatch = newContent.match(/import React[^;]*;/);
    if (reactImportMatch) {
      const reactImport = reactImportMatch[0];
      newContent = newContent.replace(
        reactImport,
        `${reactImport}
import { render, screen } from '@testing-library/react';`
      );
    }
  }

  return newContent;
};

/**
 * Convert Enzyme shallow/mount to RTL render with providers
 */
export const convertRenderCalls = (content) => {
  let newContent = content;

  // Replace shallow() calls
  newContent = newContent.replace(
    /const\s+(\w+)\s+=\s+shallow\s*\(\s*(<[^>]+>[\s\S]*?<\/[^>]+>|<[^>]+\s*\/>)\s*\);?/g,
    (match, wrapperName, component) => {
      return `const { container } = render(${component});`;
    }
  );

  // Replace mount() calls
  newContent = newContent.replace(
    /const\s+(\w+)\s+=\s+mount\s*\(\s*(<[^>]+>[\s\S]*?<\/[^>]+>|<[^>]+\s*\/>)\s*\);?/g,
    (match, wrapperName, component) => {
      return `const { container } = render(${component});`;
    }
  );

  return newContent;
};

/**
 * Convert snapshot assertions to RTL-style tests
 */
export const convertSnapshotAssertions = (content, options = {}) => {
  const { removeSnapshots = true, addBehaviorTests = true } = options;
  let newContent = content;

  if (removeSnapshots) {
    // Remove toJson wrapper and snapshot assertions
    newContent = newContent.replace(
      /expect\s*\(\s*toJson\s*\(\s*(\w+)\s*\)\s*\)\s*\.toMatchSnapshot\s*\(\s*\)\s*;?\s*\n?/g,
      ''
    );

    // Remove direct snapshot assertions
    newContent = newContent.replace(
      /expect\s*\(\s*(\w+)\s*\)\s*\.toMatchSnapshot\s*\(\s*\)\s*;?\s*\n?/g,
      ''
    );
  }

  if (addBehaviorTests) {
    // Add basic rendering assertions
    const testMatch = newContent.match(/it\s*\(\s*['"]([^'"]+)['"],\s*async\s*\(\s*\)\s*=>\s*{/);
    if (testMatch) {
      const insertPoint = newContent.indexOf('{', testMatch.index) + 1;
      const beforeInsert = newContent.substring(0, insertPoint);
      const afterInsert = newContent.substring(insertPoint);

      newContent = beforeInsert + `
    // Verify component renders without crashing
    expect(container.firstChild).toBeInTheDocument();` + afterInsert;
    }
  }

  return newContent;
};

/**
 * Convert Enzyme find() calls to RTL queries
 */
export const convertFinderMethods = (content) => {
  let newContent = content;

  // Convert wrapper.find(Component) to screen queries
  newContent = newContent.replace(
    /expect\s*\(\s*(\w+)\.find\s*\(\s*(\w+)\s*\)\s*\)\s*\.toHaveLength\s*\(\s*(\d+)\s*\)/g,
    (match, wrapper, component, count) => {
      if (count === '1') {
        return `expect(screen.getByTestId('${component.toLowerCase()}')).toBeInTheDocument()`;
      } else if (count === '0') {
        return `expect(screen.queryByTestId('${component.toLowerCase()}')).not.toBeInTheDocument()`;
      } else {
        return `expect(screen.getAllByTestId('${component.toLowerCase()}')).toHaveLength(${count})`;
      }
    }
  );

  // Convert text-based finds
  newContent = newContent.replace(
    /(\w+)\.find\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    'screen.getByText(\'$2\')'
  );

  return newContent;
};

/**
 * Add test-id attributes suggestions
 */
export const suggestTestIds = (snapshotContent) => {
  const suggestions = [];

  // Extract component names from snapshot
  const componentMatches = snapshotContent.match(/<(\w+)/g);
  if (componentMatches) {
    const uniqueComponents = [...new Set(componentMatches.map(m => m.slice(1)))];

    uniqueComponents.forEach(component => {
      if (component[0] === component[0].toUpperCase()) { // React component
        suggestions.push({
          component,
          testId: component.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase(),
          suggestion: `Add data-testid="${component.toLowerCase()}" to ${component} component`
        });
      }
    });
  }

  return suggestions;
};

/**
 * Generate RTL test template for common patterns
 */
export const generateRTLTest = (testName, componentName, props = {}) => {
  const propsString = Object.keys(props).length > 0
    ? `const mockProps = ${JSON.stringify(props, null, 2)};`
    : '';

  return `
test('${testName}', () => {
  ${propsString}

  const { container } = render(<${componentName} ${Object.keys(props).length > 0 ? '{...mockProps}' : ''} />);

  // Verify component renders
  expect(container.firstChild).toBeInTheDocument();

  // Add specific behavior tests here
  // Example: expect(screen.getByRole('button')).toBeInTheDocument();
  // Example: expect(screen.getByText('Expected Text')).toBeInTheDocument();
});`;
};

/**
 * Convert entire test file from Enzyme to RTL
 */
export const convertTestFile = async (content, options = {}) => {
  const {
    removeSnapshots = true,
    addBehaviorTests = true,
    preserveExistingTests = true
  } = options;

  let newContent = content;

  // Step 1: Convert imports
  newContent = convertImports(newContent);

  // Step 2: Convert render calls
  newContent = convertRenderCalls(newContent);

  // Step 3: Convert finder methods
  newContent = convertFinderMethods(newContent);

  // Step 4: Handle snapshots
  if (removeSnapshots) {
    newContent = convertSnapshotAssertions(newContent, { removeSnapshots, addBehaviorTests });
  }

  // Step 5: Clean up empty lines
  newContent = newContent.replace(/\n\s*\n\s*\n/g, '\n\n');

  return {
    convertedContent: newContent,
    changes: {
      importsUpdated: content !== convertImports(content),
      renderCallsConverted: content.includes('shallow') || content.includes('mount'),
      snapshotsRemoved: removeSnapshots && content.includes('toMatchSnapshot'),
      behaviorTestsAdded: addBehaviorTests
    }
  };
};

/**
 * Generate migration suggestions for a test file
 */
export const generateMigrationSuggestions = (testAnalysis, snapshotData) => {
  const suggestions = [];

  if (testAnalysis.usesEnzyme) {
    suggestions.push({
      type: 'import_conversion',
      priority: 'high',
      description: 'Replace Enzyme imports with React Testing Library',
      action: 'Remove enzyme and enzyme-to-json imports, add @testing-library/react'
    });
  }

  if (testAnalysis.usesSnapshots) {
    suggestions.push({
      type: 'snapshot_removal',
      priority: 'medium',
      description: 'Consider removing snapshot tests in favor of behavior-based tests',
      action: 'Replace toMatchSnapshot() with specific assertions about component behavior'
    });
  }

  if (testAnalysis.usesShallow) {
    suggestions.push({
      type: 'shallow_replacement',
      priority: 'high',
      description: 'Replace shallow rendering with full rendering',
      action: 'Replace shallow() with render() from React Testing Library'
    });
  }

  // Add test-id suggestions based on snapshot content
  if (snapshotData && snapshotData.snapshots.length > 0) {
    const testIdSuggestions = suggestTestIds(snapshotData.snapshots[0].snapshot);
    suggestions.push(...testIdSuggestions.map(s => ({
      type: 'test_id_addition',
      priority: 'low',
      description: s.suggestion,
      action: 'Add data-testid attributes to components for easier testing'
    })));
  }

  return suggestions;
};

/**
 * Create backup of original test file
 */
export const createTestBackup = async (filePath, content) => {
  const backupPath = `${filePath}.enzyme-backup.${Date.now()}`;
  await fs.promises.writeFile(backupPath, content);
  return backupPath;
};

export default {
  convertImports,
  convertRenderCalls,
  convertSnapshotAssertions,
  convertFinderMethods,
  suggestTestIds,
  generateRTLTest,
  convertTestFile,
  generateMigrationSuggestions,
  createTestBackup
};