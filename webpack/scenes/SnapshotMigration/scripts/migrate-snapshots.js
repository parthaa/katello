#!/usr/bin/env node

/**
 * Snapshot Migration CLI Script
 *
 * Command-line interface for the snapshot migration tool
 *
 * Usage:
 *   node migrate-snapshots.js analyze
 *   node migrate-snapshots.js remove [--dry-run] [--no-backup]
 *   node migrate-snapshots.js convert [--dry-run]
 *   node migrate-snapshots.js report
 */

const { cli } = require('../index.js');

const args = process.argv.slice(2);
const command = args[0];

const parseArgs = (args) => {
  const options = {};
  args.forEach(arg => {
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--no-backup') {
      options.backup = false;
    } else if (arg === '--real') {
      options.dryRun = false;
    }
  });
  return options;
};

const showUsage = () => {
  console.log(`
Snapshot Migration Tool

Usage:
  node migrate-snapshots.js <command> [options]

Commands:
  analyze                     Analyze project for snapshot files
  remove [--dry-run] [--real] [--no-backup]  Remove snapshot files
  convert [--dry-run] [--real]               Convert tests to RTL
  report                      Generate detailed migration report

Options:
  --dry-run                   Simulate the operation without making changes (default)
  --real                      Actually perform the operation
  --no-backup                 Don't create backup files (for remove command)

Examples:
  node migrate-snapshots.js analyze
  node migrate-snapshots.js remove --dry-run
  node migrate-snapshots.js remove --real --no-backup
  node migrate-snapshots.js convert --real
  node migrate-snapshots.js report
`);
};

const main = async () => {
  if (!command || command === 'help' || command === '--help') {
    showUsage();
    return;
  }

  const options = parseArgs(args.slice(1));

  try {
    switch (command) {
      case 'analyze':
        await cli.analyzeProject();
        break;

      case 'remove':
        // Default to dry-run unless --real is specified
        if (!options.hasOwnProperty('dryRun')) {
          options.dryRun = true;
        }
        await cli.removeSnapshots(options);
        if (options.dryRun) {
          console.log('\n💡 Use --real flag to actually remove files');
        }
        break;

      case 'convert':
        // Default to dry-run unless --real is specified
        if (!options.hasOwnProperty('dryRun')) {
          options.dryRun = true;
        }
        await cli.convertTests(options);
        if (options.dryRun) {
          console.log('\n💡 Use --real flag to actually convert files');
        }
        break;

      case 'report':
        await cli.generateReport();
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        showUsage();
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  main();
}