/**
 * Snapshot Migration Skill - Main Entry Point
 *
 * This skill helps migrate from Enzyme snapshot tests to React Testing Library
 * by providing utilities to:
 * 1. Remove existing .snap files safely
 * 2. Convert Enzyme-based tests to RTL equivalents
 * 3. Generate better behavior-based tests
 */

import SnapshotMigrationTool from './components/SnapshotMigrationTool';
import snapshotFileUtils from './utils/snapshotFileUtils';
import testConversionUtils from './utils/testConversionUtils';

// CLI utilities for command-line usage
export const cli = {
  async analyzeProject(rootDir = 'webpack') {
    console.log('🔍 Analyzing project for snapshot files...');
    const files = await snapshotFileUtils.findSnapshotFiles(rootDir);
    const report = await snapshotFileUtils.generateMigrationReport(files);

    console.log(`\n📊 Analysis Results:`);
    console.log(`   Snapshot files found: ${report.totalSnapshotFiles}`);
    console.log(`   Total snapshots: ${report.totalSnapshots}`);
    console.log(`   Migration suggestions: ${report.migrationSuggestions.length}`);

    return report;
  },

  async removeSnapshots(options = {}) {
    const { dryRun = true, backup = true, rootDir = 'webpack' } = options;

    console.log(`🗑️  ${dryRun ? 'Simulating' : 'Removing'} snapshot files...`);

    const files = await snapshotFileUtils.findSnapshotFiles(rootDir);
    const results = await snapshotFileUtils.removeSnapshotFiles(files, { dryRun, backup });

    if (!dryRun) {
      await snapshotFileUtils.cleanupSnapshotDirectories(rootDir, { dryRun });
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`\n✅ Results:`);
    console.log(`   Successfully ${dryRun ? 'would remove' : 'removed'}: ${successful}`);
    if (failed > 0) {
      console.log(`   Failed: ${failed}`);
    }

    return results;
  },

  async convertTests(options = {}) {
    const { dryRun = true, rootDir = 'webpack' } = options;

    console.log(`🔄 ${dryRun ? 'Simulating' : 'Converting'} tests to React Testing Library...`);

    const files = await snapshotFileUtils.findSnapshotFiles(rootDir);
    const conversions = [];

    for (const snapshotFile of files) {
      const snapshotData = await snapshotFileUtils.parseSnapshotFile(snapshotFile);
      if (snapshotData) {
        const testAnalysis = await snapshotFileUtils.analyzeTestFile(snapshotData.testFilePath);

        if (testAnalysis && testAnalysis.usesEnzyme) {
          const suggestions = testConversionUtils.generateMigrationSuggestions(testAnalysis, snapshotData);

          conversions.push({
            testFile: snapshotData.testFilePath,
            suggestions,
            requiresConversion: true
          });

          if (!dryRun) {
            try {
              const originalContent = await fs.promises.readFile(snapshotData.testFilePath, 'utf8');
              const backupPath = await testConversionUtils.createTestBackup(
                snapshotData.testFilePath,
                originalContent
              );

              const conversion = await testConversionUtils.convertTestFile(originalContent);
              await fs.promises.writeFile(snapshotData.testFilePath, conversion.convertedContent);

              console.log(`✅ Converted: ${snapshotData.testFilePath}`);
              console.log(`   Backup: ${backupPath}`);
            } catch (error) {
              console.error(`❌ Failed to convert: ${snapshotData.testFilePath}`, error.message);
            }
          }
        }
      }
    }

    console.log(`\n📝 Conversion Summary:`);
    console.log(`   Files requiring conversion: ${conversions.length}`);

    return conversions;
  },

  async generateReport(rootDir = 'webpack') {
    const report = await this.analyzeProject(rootDir);

    console.log(`\n📋 Detailed Migration Report:`);
    console.log('='.repeat(50));

    report.fileAnalysis.forEach((analysis, index) => {
      console.log(`\n${index + 1}. ${analysis.snapshotFile}`);
      console.log(`   Test file: ${analysis.testFile}`);
      console.log(`   Snapshots: ${analysis.snapshotCount}`);

      if (analysis.testAnalysis) {
        const { testAnalysis } = analysis;
        console.log(`   Uses Enzyme: ${testAnalysis.usesEnzyme ? '✓' : '✗'}`);
        console.log(`   Uses RTL: ${testAnalysis.usesRTL ? '✓' : '✗'}`);
        console.log(`   Uses Snapshots: ${testAnalysis.usesSnapshots ? '✓' : '✗'}`);
      }
    });

    if (report.migrationSuggestions.length > 0) {
      console.log(`\n🔧 Migration Suggestions:`);
      report.migrationSuggestions.forEach((suggestion, index) => {
        console.log(`${index + 1}. ${suggestion.file} - ${suggestion.suggestion}`);
      });
    }

    return report;
  }
};

// React component export
export default SnapshotMigrationTool;

// Utility exports
export {
  snapshotFileUtils,
  testConversionUtils,
  SnapshotMigrationTool
};