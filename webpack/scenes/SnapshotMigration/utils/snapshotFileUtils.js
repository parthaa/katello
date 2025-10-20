/**
 * Snapshot File Utilities
 *
 * Utilities for identifying, analyzing, and removing Jest snapshot files
 * while migrating from Enzyme snapshot tests to React Testing Library
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

/**
 * Find all snapshot files in the project
 */
export const findSnapshotFiles = async (rootDir = 'webpack') => {
  const snapshotFiles = [];

  const scanDirectory = async (dir) => {
    try {
      const entries = await readdir(dir);

      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stats = await stat(fullPath);

        if (stats.isDirectory() && entry === '__snapshots__') {
          // Found a snapshots directory, scan for .snap files
          const snapFiles = await readdir(fullPath);
          for (const snapFile of snapFiles) {
            if (snapFile.endsWith('.snap')) {
              snapshotFiles.push(path.join(fullPath, snapFile));
            }
          }
        } else if (stats.isDirectory() && !entry.startsWith('.')) {
          // Recursively scan subdirectories
          await scanDirectory(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Could not scan directory ${dir}: ${error.message}`);
    }
  };

  await scanDirectory(rootDir);
  return snapshotFiles;
};

/**
 * Parse a snapshot file to extract test information
 */
export const parseSnapshotFile = async (filePath) => {
  try {
    const content = await readFile(filePath, 'utf8');
    const snapshots = [];

    // Extract snapshot exports using regex
    const snapshotRegex = /exports\[`([^`]+)`\] = `([^`]+)`/g;
    let match;

    while ((match = snapshotRegex.exec(content)) !== null) {
      snapshots.push({
        testName: match[1],
        snapshot: match[2],
        filePath
      });
    }

    return {
      filePath,
      testFilePath: filePath.replace('/__snapshots__/', '/').replace('.snap', ''),
      snapshots,
      content
    };
  } catch (error) {
    console.error(`Error parsing snapshot file ${filePath}: ${error.message}`);
    return null;
  }
};

/**
 * Analyze test file to understand current testing patterns
 */
export const analyzeTestFile = async (testFilePath) => {
  try {
    const content = await readFile(testFilePath, 'utf8');

    const analysis = {
      filePath: testFilePath,
      usesEnzyme: content.includes('enzyme'),
      usesShallow: content.includes('shallow'),
      usesMount: content.includes('mount'),
      usesRTL: content.includes('@testing-library/react'),
      usesToJson: content.includes('toJson'),
      usesSnapshots: content.includes('toMatchSnapshot'),
      imports: extractImports(content),
      tests: extractTestNames(content),
      components: extractComponentUsage(content)
    };

    return analysis;
  } catch (error) {
    console.error(`Error analyzing test file ${testFilePath}: ${error.message}`);
    return null;
  }
};

/**
 * Extract import statements from test file
 */
const extractImports = (content) => {
  const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  const imports = [];
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return imports;
};

/**
 * Extract test names from test file
 */
const extractTestNames = (content) => {
  const testRegex = /(?:test|it)\s*\(\s*['"]([^'"]+)['"],/g;
  const tests = [];
  let match;

  while ((match = testRegex.exec(content)) !== null) {
    tests.push(match[1]);
  }

  return tests;
};

/**
 * Extract component usage patterns
 */
const extractComponentUsage = (content) => {
  const componentRegex = /<(\w+)[\s>]/g;
  const components = new Set();
  let match;

  while ((match = componentRegex.exec(content)) !== null) {
    if (match[1][0] === match[1][0].toUpperCase()) { // Component names start with uppercase
      components.add(match[1]);
    }
  }

  return Array.from(components);
};

/**
 * Remove snapshot files safely
 */
export const removeSnapshotFiles = async (snapshotFiles, options = {}) => {
  const { dryRun = false, backup = true } = options;
  const results = [];

  for (const filePath of snapshotFiles) {
    try {
      if (backup && !dryRun) {
        // Create backup
        const backupPath = `${filePath}.backup.${Date.now()}`;
        const content = await readFile(filePath, 'utf8');
        await writeFile(backupPath, content);
        console.log(`Backup created: ${backupPath}`);
      }

      if (!dryRun) {
        await unlink(filePath);
        console.log(`Removed: ${filePath}`);
      } else {
        console.log(`Would remove: ${filePath}`);
      }

      results.push({
        filePath,
        action: dryRun ? 'would_remove' : 'removed',
        success: true
      });
    } catch (error) {
      console.error(`Error removing ${filePath}: ${error.message}`);
      results.push({
        filePath,
        action: 'error',
        success: false,
        error: error.message
      });
    }
  }

  return results;
};

/**
 * Remove empty __snapshots__ directories
 */
export const cleanupSnapshotDirectories = async (rootDir = 'webpack', options = {}) => {
  const { dryRun = false } = options;
  const cleanedDirs = [];

  const scanDirectory = async (dir) => {
    try {
      const entries = await readdir(dir);

      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stats = await stat(fullPath);

        if (stats.isDirectory()) {
          if (entry === '__snapshots__') {
            // Check if directory is empty
            const snapshots = await readdir(fullPath);
            if (snapshots.length === 0) {
              if (!dryRun) {
                await fs.promises.rmdir(fullPath);
                console.log(`Removed empty directory: ${fullPath}`);
              } else {
                console.log(`Would remove empty directory: ${fullPath}`);
              }
              cleanedDirs.push(fullPath);
            }
          } else if (!entry.startsWith('.')) {
            await scanDirectory(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`Could not scan directory ${dir}: ${error.message}`);
    }
  };

  await scanDirectory(rootDir);
  return cleanedDirs;
};

/**
 * Generate migration report
 */
export const generateMigrationReport = async (snapshotFiles) => {
  const report = {
    totalSnapshotFiles: snapshotFiles.length,
    totalSnapshots: 0,
    fileAnalysis: [],
    migrationSuggestions: []
  };

  for (const filePath of snapshotFiles) {
    const snapshotData = await parseSnapshotFile(filePath);
    if (snapshotData) {
      const testAnalysis = await analyzeTestFile(snapshotData.testFilePath);

      report.totalSnapshots += snapshotData.snapshots.length;
      report.fileAnalysis.push({
        snapshotFile: filePath,
        testFile: snapshotData.testFilePath,
        snapshotCount: snapshotData.snapshots.length,
        testAnalysis
      });

      // Generate migration suggestions
      if (testAnalysis && testAnalysis.usesEnzyme && !testAnalysis.usesRTL) {
        report.migrationSuggestions.push({
          file: snapshotData.testFilePath,
          type: 'enzyme_to_rtl',
          suggestion: 'Convert from Enzyme shallow/mount to React Testing Library render'
        });
      }
    }
  }

  return report;
};

export default {
  findSnapshotFiles,
  parseSnapshotFile,
  analyzeTestFile,
  removeSnapshotFiles,
  cleanupSnapshotDirectories,
  generateMigrationReport
};