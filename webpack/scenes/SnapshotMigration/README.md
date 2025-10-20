# Snapshot Migration Tool

A comprehensive tool for migrating from Enzyme snapshot tests to React Testing Library-based behavior tests in the Katello codebase.

## Features

- 🔍 **Analyze** existing snapshot files and test patterns
- 🗑️ **Remove** snapshot files safely with backups
- 🔄 **Convert** Enzyme tests to React Testing Library
- 📊 **Report** detailed migration analysis
- 🛡️ **Safe** operations with dry-run mode and backups

## Quick Start

### Command Line Interface

```bash
# Analyze the project for snapshot files
node webpack/scenes/SnapshotMigration/scripts/migrate-snapshots.js analyze

# Generate detailed migration report
node webpack/scenes/SnapshotMigration/scripts/migrate-snapshots.js report

# Simulate removing snapshots (dry run)
node webpack/scenes/SnapshotMigration/scripts/migrate-snapshots.js remove --dry-run

# Actually remove snapshots with backups
node webpack/scenes/SnapshotMigration/scripts/migrate-snapshots.js remove --real

# Simulate test conversion (dry run)
node webpack/scenes/SnapshotMigration/scripts/migrate-snapshots.js convert --dry-run

# Actually convert tests to RTL
node webpack/scenes/SnapshotMigration/scripts/migrate-snapshots.js convert --real
```

### Programmatic Usage

```javascript
import { cli } from './webpack/scenes/SnapshotMigration';

// Analyze project
const report = await cli.analyzeProject();

// Remove snapshots
const removeResults = await cli.removeSnapshots({
  dryRun: false,
  backup: true
});

// Convert tests
const convertResults = await cli.convertTests({
  dryRun: false
});
```

## What It Does

### Snapshot File Analysis

The tool scans your project for:
- `__snapshots__` directories
- `.snap` files
- Associated test files
- Test patterns (Enzyme vs RTL usage)

### Test Conversion

Converts Enzyme patterns to React Testing Library:

**Before (Enzyme):**
```javascript
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';

test('renders correctly', () => {
  const wrapper = shallow(<MyComponent />);
  expect(toJson(wrapper)).toMatchSnapshot();
  expect(wrapper.find('button')).toHaveLength(1);
});
```

**After (React Testing Library):**
```javascript
import { render, screen } from '@testing-library/react';

test('renders correctly', () => {
  const { container } = render(<MyComponent />);

  expect(container.firstChild).toBeInTheDocument();
  expect(screen.getByRole('button')).toBeInTheDocument();
});
```

### Conversion Features

- ✅ Import statement updates
- ✅ Render method conversion (`shallow`/`mount` → `render`)
- ✅ Query method conversion (`find` → `getBy`/`queryBy`)
- ✅ Snapshot removal with behavior test suggestions
- ✅ Backup creation for rollback safety
- ✅ Component type detection for better templates

## Component Templates

The tool includes pre-built templates for common component patterns:

### Basic Component
```javascript
test('renders without crashing', () => {
  const { container } = render(<Component />);
  expect(container.firstChild).toBeInTheDocument();
});
```

### Table Component
```javascript
test('renders table with correct structure', () => {
  render(<TableComponent />);
  expect(screen.getByRole('table')).toBeInTheDocument();
});
```

### Modal Component
```javascript
test('renders when open', () => {
  render(<ModalComponent isOpen={true} />);
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});
```

### Form Component
```javascript
test('handles form submission', async () => {
  const user = userEvent.setup();
  const onSubmit = jest.fn();

  render(<FormComponent onSubmit={onSubmit} />);
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(onSubmit).toHaveBeenCalled();
});
```

## Safety Features

### Dry Run Mode
All operations default to dry-run mode, showing what would be changed without making actual modifications.

### Automatic Backups
- Snapshot files: `.snap.backup.{timestamp}`
- Test files: `.test.js.enzyme-backup.{timestamp}`

### Rollback Instructions
If you need to rollback changes:

```bash
# Restore from backup
cp original-file.backup.12345678 original-file.js

# Or use git (recommended)
git checkout -- path/to/modified/file.js
```

## Migration Strategy

### Recommended Workflow

1. **Analyze First**
   ```bash
   node migrate-snapshots.js analyze
   ```

2. **Review the Report**
   ```bash
   node migrate-snapshots.js report
   ```

3. **Test on Small Subset**
   - Choose 1-2 files to convert manually first
   - Verify the conversion works as expected

4. **Dry Run Full Migration**
   ```bash
   node migrate-snapshots.js convert --dry-run
   ```

5. **Commit Current State**
   ```bash
   git add -A && git commit -m "Pre-migration checkpoint"
   ```

6. **Execute Migration**
   ```bash
   node migrate-snapshots.js convert --real
   ```

7. **Run Tests**
   ```bash
   npm test
   ```

8. **Remove Snapshots (if tests pass)**
   ```bash
   node migrate-snapshots.js remove --real
   ```

### Manual Follow-up Tasks

After automatic conversion, you may need to:

1. **Add test-ids** to components for easier querying
2. **Review behavior tests** and add specific assertions
3. **Update complex interactions** that couldn't be auto-converted
4. **Add proper user-event** for user interactions
5. **Mock external dependencies** appropriately

## Project Integration

### Adding to Package.json

```json
{
  "scripts": {
    "migrate:analyze": "node webpack/scenes/SnapshotMigration/scripts/migrate-snapshots.js analyze",
    "migrate:report": "node webpack/scenes/SnapshotMigration/scripts/migrate-snapshots.js report",
    "migrate:convert": "node webpack/scenes/SnapshotMigration/scripts/migrate-snapshots.js convert --real",
    "migrate:remove": "node webpack/scenes/SnapshotMigration/scripts/migrate-snapshots.js remove --real"
  }
}
```

### Jest Configuration

Ensure your Jest config supports RTL:

```javascript
// jest.config.js
module.exports = {
  setupFilesAfterEnv: [
    '@testing-library/jest-dom'
  ],
  // ... other config
};
```

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors**
   - Ensure React Testing Library is installed
   - Check import paths in converted tests

2. **Tests failing after conversion**
   - Review converted query methods
   - Add missing test-ids to components
   - Update assertions for new testing approach

3. **Component not rendering**
   - Check if component needs providers (Redux, Router)
   - Verify prop requirements
   - Add necessary mocks

### Getting Help

1. Review the generated backup files
2. Check the migration report for specific suggestions
3. Refer to React Testing Library documentation
4. Consider manual conversion for complex cases

## File Structure

```
webpack/scenes/SnapshotMigration/
├── README.md                     # This file
├── index.js                      # Main exports
├── components/
│   └── SnapshotMigrationTool.js  # React UI component
├── utils/
│   ├── snapshotFileUtils.js      # File system operations
│   └── testConversionUtils.js    # Test conversion logic
├── templates/
│   └── conversionTemplates.js    # Test templates
├── scripts/
│   └── migrate-snapshots.js      # CLI script
└── __tests__/
    └── snapshotMigration.test.js # Tests for the tool
```

## Contributing

To enhance the migration tool:

1. Add new conversion patterns in `testConversionUtils.js`
2. Create new templates in `templates/conversionTemplates.js`
3. Extend file operations in `snapshotFileUtils.js`
4. Add tests in `__tests__/`

## Limitations

- Cannot convert complex Enzyme-specific patterns automatically
- May require manual adjustment of converted tests
- Does not handle custom Enzyme matchers
- Limited to basic prop extraction from snapshots

## Best Practices

1. **Always use version control** before running migrations
2. **Test converted files** before removing snapshots
3. **Add meaningful test-ids** to components
4. **Focus on behavior** rather than implementation details
5. **Use user-event** for realistic user interactions