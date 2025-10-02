import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { translate as __ } from 'foremanReact/common/I18n';
import PageLayout from 'foremanReact/routes/common/PageLayout/PageLayout';
import SyncManagementTable from './Table/SyncManagementTable';
import { getSyncManagementRepositories } from './SyncManagementActions';

const SyncManagementPage = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Initial data fetch
    dispatch(getSyncManagementRepositories());
  }, [dispatch]);

  return (
    <PageLayout
      header={__('Sync Status')}
      searchable={false}
      searchProps={{
        placeholder: __('Search repositories...'),
      }}
    >
      <SyncManagementTable />
    </PageLayout>
  );
};

export default SyncManagementPage;