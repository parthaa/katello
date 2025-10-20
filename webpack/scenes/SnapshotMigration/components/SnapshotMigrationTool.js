/**
 * Snapshot Migration Tool
 *
 * Main component for managing the migration from Enzyme snapshots
 * to React Testing Library-based tests
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Alert,
  Progress,
  List,
  ListItem,
  Checkbox,
  Modal,
  ModalVariant,
  Text,
  TextContent,
  TextVariants,
  Divider,
  Label,
  Split,
  SplitItem,
  Flex,
  FlexItem
} from '@patternfly/react-core';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InfoCircleIcon,
  TrashIcon,
  EditIcon
} from '@patternfly/react-icons';

import snapshotFileUtils from '../utils/snapshotFileUtils';
import testConversionUtils from '../utils/testConversionUtils';

const SnapshotMigrationTool = () => {
  const [snapshotFiles, setSnapshotFiles] = useState([]);
  const [migrationReport, setMigrationReport] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [migrationResults, setMigrationResults] = useState(null);
  const [operationType, setOperationType] = useState(null); // 'remove' or 'convert'

  useEffect(() => {
    analyzeProject();
  }, []);

  const analyzeProject = async () => {
    setIsAnalyzing(true);
    try {
      const files = await snapshotFileUtils.findSnapshotFiles();
      setSnapshotFiles(files);

      const report = await snapshotFileUtils.generateMigrationReport(files);
      setMigrationReport(report);

      // Select all files by default
      setSelectedFiles(new Set(files));
    } catch (error) {
      console.error('Error analyzing project:', error);
    }
    setIsAnalyzing(false);
  };

  const handleFileSelection = (filePath, checked) => {
    const newSelected = new Set(selectedFiles);
    if (checked) {
      newSelected.add(filePath);
    } else {
      newSelected.delete(filePath);
    }
    setSelectedFiles(newSelected);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedFiles(new Set(snapshotFiles));
    } else {
      setSelectedFiles(new Set());
    }
  };

  const confirmRemoveSnapshots = () => {
    setOperationType('remove');
    setShowConfirmModal(true);
  };

  const confirmConvertTests = () => {
    setOperationType('convert');
    setShowConfirmModal(true);
  };

  const executeOperation = async () => {
    setShowConfirmModal(false);

    if (operationType === 'remove') {
      await removeSelectedSnapshots();
    } else if (operationType === 'convert') {
      await convertSelectedTests();
    }
  };

  const removeSelectedSnapshots = async () => {
    setIsRemoving(true);
    try {
      const filesToRemove = Array.from(selectedFiles);
      const results = await snapshotFileUtils.removeSnapshotFiles(filesToRemove, {
        backup: true,
        dryRun: false
      });

      // Clean up empty snapshot directories
      await snapshotFileUtils.cleanupSnapshotDirectories();

      setMigrationResults({
        type: 'removal',
        results,
        summary: {
          total: filesToRemove.length,
          success: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }
      });

      // Refresh the analysis
      await analyzeProject();
    } catch (error) {
      console.error('Error removing snapshots:', error);
    }
    setIsRemoving(false);
  };

  const convertSelectedTests = async () => {
    setIsConverting(true);
    try {
      const results = [];

      for (const snapshotFile of selectedFiles) {
        const snapshotData = await snapshotFileUtils.parseSnapshotFile(snapshotFile);
        if (snapshotData) {
          const testAnalysis = await snapshotFileUtils.analyzeTestFile(snapshotData.testFilePath);

          if (testAnalysis) {
            // Read original test file
            const originalContent = await fs.promises.readFile(snapshotData.testFilePath, 'utf8');

            // Create backup
            const backupPath = await testConversionUtils.createTestBackup(
              snapshotData.testFilePath,
              originalContent
            );

            // Convert the test
            const conversion = await testConversionUtils.convertTestFile(originalContent, {
              removeSnapshots: true,
              addBehaviorTests: true
            });

            // Write converted content
            await fs.promises.writeFile(snapshotData.testFilePath, conversion.convertedContent);

            results.push({
              file: snapshotData.testFilePath,
              backupPath,
              changes: conversion.changes,
              success: true
            });
          }
        }
      }

      setMigrationResults({
        type: 'conversion',
        results,
        summary: {
          total: results.length,
          success: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }
      });
    } catch (error) {
      console.error('Error converting tests:', error);
    }
    setIsConverting(false);
  };

  if (isAnalyzing) {
    return (
      <Card>
        <CardHeader>
          <Text component={TextVariants.h2}>Analyzing Project...</Text>
        </CardHeader>
        <CardBody>
          <Progress value={undefined} />
          <Text component={TextVariants.p}>
            Scanning for snapshot files and analyzing test patterns...
          </Text>
        </CardBody>
      </Card>
    );
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <Flex>
            <FlexItem grow={{ default: 'grow' }}>
              <Text component={TextVariants.h2}>Snapshot Migration Tool</Text>
              <Text component={TextVariants.p}>
                Migrate from Enzyme snapshot tests to React Testing Library
              </Text>
            </FlexItem>
            <FlexItem>
              <Button variant="link" onClick={analyzeProject}>
                Refresh Analysis
              </Button>
            </FlexItem>
          </Flex>
        </CardHeader>
        <CardBody>
          {migrationReport && (
            <div>
              <Alert
                variant="info"
                title="Migration Analysis"
                style={{ marginBottom: '20px' }}
              >
                Found {migrationReport.totalSnapshotFiles} snapshot files containing{' '}
                {migrationReport.totalSnapshots} individual snapshots.
              </Alert>

              <Split hasGutter>
                <SplitItem>
                  <Card isCompact>
                    <CardBody>
                      <Text component={TextVariants.h4}>
                        {migrationReport.totalSnapshotFiles}
                      </Text>
                      <Text component={TextVariants.small}>Snapshot Files</Text>
                    </CardBody>
                  </Card>
                </SplitItem>
                <SplitItem>
                  <Card isCompact>
                    <CardBody>
                      <Text component={TextVariants.h4}>
                        {migrationReport.totalSnapshots}
                      </Text>
                      <Text component={TextVariants.small}>Total Snapshots</Text>
                    </CardBody>
                  </Card>
                </SplitItem>
                <SplitItem>
                  <Card isCompact>
                    <CardBody>
                      <Text component={TextVariants.h4}>
                        {migrationReport.migrationSuggestions.length}
                      </Text>
                      <Text component={TextVariants.small}>Suggested Migrations</Text>
                    </CardBody>
                  </Card>
                </SplitItem>
              </Split>

              <Divider style={{ margin: '20px 0' }} />

              <div style={{ marginBottom: '20px' }}>
                <Flex>
                  <FlexItem>
                    <Checkbox
                      id="select-all"
                      label={`Select All (${snapshotFiles.length} files)`}
                      isChecked={selectedFiles.size === snapshotFiles.length}
                      isIndeterminate={selectedFiles.size > 0 && selectedFiles.size < snapshotFiles.length}
                      onChange={(checked) => handleSelectAll(checked)}
                    />
                  </FlexItem>
                  <FlexItem align={{ default: 'alignRight' }}>
                    <Split hasGutter>
                      <SplitItem>
                        <Button
                          variant="secondary"
                          icon={<EditIcon />}
                          onClick={confirmConvertTests}
                          isDisabled={selectedFiles.size === 0 || isConverting}
                          isLoading={isConverting}
                        >
                          Convert to RTL Tests
                        </Button>
                      </SplitItem>
                      <SplitItem>
                        <Button
                          variant="danger"
                          icon={<TrashIcon />}
                          onClick={confirmRemoveSnapshots}
                          isDisabled={selectedFiles.size === 0 || isRemoving}
                          isLoading={isRemoving}
                        >
                          Remove Snapshots
                        </Button>
                      </SplitItem>
                    </Split>
                  </FlexItem>
                </Flex>
              </div>

              <Card>
                <CardHeader>
                  <Text component={TextVariants.h3}>Snapshot Files</Text>
                </CardHeader>
                <CardBody>
                  <List>
                    {migrationReport.fileAnalysis.map((analysis, index) => (
                      <ListItem key={index}>
                        <Flex>
                          <FlexItem>
                            <Checkbox
                              id={`file-${index}`}
                              isChecked={selectedFiles.has(analysis.snapshotFile)}
                              onChange={(checked) => handleFileSelection(analysis.snapshotFile, checked)}
                            />
                          </FlexItem>
                          <FlexItem grow={{ default: 'grow' }}>
                            <div>
                              <Text component={TextVariants.p}>
                                {analysis.snapshotFile}
                              </Text>
                              <Text component={TextVariants.small} style={{ color: '#666' }}>
                                Test file: {analysis.testFile}
                              </Text>
                              <Text component={TextVariants.small} style={{ color: '#666' }}>
                                {analysis.snapshotCount} snapshots
                              </Text>
                            </div>
                          </FlexItem>
                          <FlexItem>
                            <div>
                              {analysis.testAnalysis?.usesEnzyme && (
                                <Label color="orange" icon={<ExclamationTriangleIcon />}>
                                  Enzyme
                                </Label>
                              )}
                              {analysis.testAnalysis?.usesRTL && (
                                <Label color="green" icon={<CheckCircleIcon />}>
                                  RTL
                                </Label>
                              )}
                            </div>
                          </FlexItem>
                        </Flex>
                      </ListItem>
                    ))}
                  </List>
                </CardBody>
              </Card>
            </div>
          )}

          {migrationResults && (
            <Alert
              variant={migrationResults.summary.failed === 0 ? 'success' : 'warning'}
              title={`${operationType === 'remove' ? 'Snapshot Removal' : 'Test Conversion'} Complete`}
              style={{ marginTop: '20px' }}
            >
              <div>
                Successfully processed {migrationResults.summary.success} of {migrationResults.summary.total} files.
                {migrationResults.summary.failed > 0 && (
                  <div>Failed to process {migrationResults.summary.failed} files.</div>
                )}
              </div>
            </Alert>
          )}
        </CardBody>
      </Card>

      <Modal
        variant={ModalVariant.small}
        title={`Confirm ${operationType === 'remove' ? 'Snapshot Removal' : 'Test Conversion'}`}
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        actions={[
          <Button key="confirm" variant="primary" onClick={executeOperation}>
            {operationType === 'remove' ? 'Remove Snapshots' : 'Convert Tests'}
          </Button>,
          <Button key="cancel" variant="link" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </Button>
        ]}
      >
        <TextContent>
          {operationType === 'remove' ? (
            <div>
              <Text component={TextVariants.p}>
                This will permanently remove {selectedFiles.size} snapshot files.
                Backup copies will be created before removal.
              </Text>
              <Alert variant="warning" title="Warning" isInline>
                This action cannot be easily undone. Make sure you have committed your changes to version control.
              </Alert>
            </div>
          ) : (
            <div>
              <Text component={TextVariants.p}>
                This will convert {selectedFiles.size} test files from Enzyme to React Testing Library.
                Backup copies of original files will be created.
              </Text>
              <Alert variant="info" title="Note" isInline>
                You may need to manually adjust the converted tests to ensure they work correctly.
              </Alert>
            </div>
          )}
        </TextContent>
      </Modal>
    </div>
  );
};

export default SnapshotMigrationTool;