import React from 'react';
import PropTypes from 'prop-types';
import { translate as __ } from 'foremanReact/common/I18n';
import {
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Button,
  Spinner,
  Split,
  SplitItem,
} from '@patternfly/react-core';
import {
  SyncIcon,
  ExclamationTriangleIcon,
} from '@patternfly/react-icons';

const SyncManagementToolbar = ({
  selectedCount,
  totalCount,
  canSync,
  isSyncing,
  syncable,
  onSyncSelected,
  onSelectRepositories,
}) => {
  const handleSelectAll = () => {
    // This would need to be implemented to get all repository IDs
    // For now, we'll pass an empty array as a placeholder
    onSelectRepositories([]);
  };

  const handleSelectNone = () => {
    onSelectRepositories([]);
  };

  const renderSyncButton = () => {
    if (!syncable) {
      return (
        <Button
          variant="secondary"
          isDisabled
          icon={<ExclamationTriangleIcon />}
        >
          {__('No Sync Permission')}
        </Button>
      );
    }

    return (
      <Button
        variant="primary"
        onClick={onSyncSelected}
        isDisabled={!canSync}
        icon={isSyncing ? <Spinner size="sm" /> : <SyncIcon />}
        isLoading={isSyncing}
      >
        {isSyncing ? __('Syncing...') : __('Synchronize Now')}
      </Button>
    );
  };

  const renderSelectionInfo = () => {
    if (selectedCount === 0) {
      return (
        <span className="text-muted">
          {__('No repositories selected')}
        </span>
      );
    }

    return (
      <span>
        {__('%s of %s repositories selected', selectedCount, totalCount)}
      </span>
    );
  };

  return (
    <Toolbar className="sync-management-toolbar">
      <ToolbarContent>
        <ToolbarItem>
          <Split hasGutter>
            <SplitItem>
              <Button
                variant="link"
                onClick={handleSelectAll}
                isSmall
              >
                {__('Select All')}
              </Button>
            </SplitItem>
            <SplitItem>
              <Button
                variant="link"
                onClick={handleSelectNone}
                isSmall
              >
                {__('Select None')}
              </Button>
            </SplitItem>
          </Split>
        </ToolbarItem>

        <ToolbarItem>
          {renderSelectionInfo()}
        </ToolbarItem>

        <ToolbarItem align={{ default: 'alignRight' }}>
          {renderSyncButton()}
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  );
};

SyncManagementToolbar.propTypes = {
  selectedCount: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  canSync: PropTypes.bool.isRequired,
  isSyncing: PropTypes.bool.isRequired,
  syncable: PropTypes.bool.isRequired,
  onSyncSelected: PropTypes.func.isRequired,
  onSelectRepositories: PropTypes.func.isRequired,
};

export default SyncManagementToolbar;