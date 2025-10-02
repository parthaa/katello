import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Button, Progress, ProgressSize } from '@patternfly/react-core';
import { translate as __ } from 'foremanReact/common/I18n';
import LongDateTime from 'foremanReact/components/common/dates/LongDateTime';
import { urlBuilder } from 'foremanReact/common/urlHelpers';

const SyncStatusCell = ({
  syncStatus,
  onCancelSync,
  repository,
}) => {
  if (!syncStatus) {
    return <span>{__('Unknown')}</span>;
  }

  const {
    is_running: isRunning,
    state,
    sync_id: syncId,
    progress,
    start_time: startTime,
    duration,
    packages,
    size,
    display_size: displaySize,
    error_details: errorDetails,
  } = syncStatus;

  const taskUrl = syncId ? urlBuilder('foreman_tasks/tasks', syncId) : null;

  if (isRunning) {
    const progressPercent = progress?.progress || 0;
    return (
      <div>
        <Progress
          value={progressPercent}
          title={__('Syncing...')}
          size={ProgressSize.sm}
        />
        <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
          {progressPercent}% - {displaySize || ''}
        </div>
        {onCancelSync && repository?.permissions?.syncable && (
          <Button
            variant="link"
            size="sm"
            onClick={() => onCancelSync(repository.id)}
            style={{ padding: 0, marginTop: '0.25rem' }}
          >
            {__('Cancel')}
          </Button>
        )}
      </div>
    );
  }

  if (state && syncId) {
    return (
      <div>
        <Link to={taskUrl} target="_blank" rel="noopener noreferrer">
          {state}
        </Link>
        {startTime && (
          <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {__('Started')}: <LongDateTime date={startTime} showRelativeTimeTooltip />
          </div>
        )}
        {duration && (
          <div style={{ fontSize: '0.875rem' }}>
            {__('Duration')}: {duration}
          </div>
        )}
      </div>
    );
  }

  return <span>{__('Never synced')}</span>;
};

SyncStatusCell.propTypes = {
  syncStatus: PropTypes.shape({
    is_running: PropTypes.bool,
    state: PropTypes.string,
    sync_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    progress: PropTypes.shape({
      progress: PropTypes.number,
    }),
    start_time: PropTypes.string,
    duration: PropTypes.string,
    packages: PropTypes.number,
    size: PropTypes.number,
    display_size: PropTypes.string,
    error_details: PropTypes.object,
  }),
  onCancelSync: PropTypes.func,
  repository: PropTypes.object,
};

SyncStatusCell.defaultProps = {
  syncStatus: null,
  onCancelSync: null,
  repository: null,
};

export default SyncStatusCell;