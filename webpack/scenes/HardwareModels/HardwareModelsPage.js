import React from 'react';
import { translate as __ } from 'foremanReact/common/I18n';

import TableIndexPage from 'foremanReact/components/PF4/TableIndexPage/TableIndexPage';

import {
  getHardwareModelsColumns,
  getHardwareModelsSortParams,
  getHardwareModelsSearchProps,
  getApiConfig,
} from './HardwareModelsTableSchema';

const HardwareModelsPage = () => {
  // Get configuration from schema
  const apiConfig = getApiConfig();
  const searchProps = getHardwareModelsSearchProps();
  const columns = getHardwareModelsColumns();
  const columnsToSortParams = getHardwareModelsSortParams();

  return (
    <TableIndexPage
      apiUrl={apiConfig.url}
      apiOptions={{ key: apiConfig.key }}
      header={__('Hardware Models')}
      controller={apiConfig.url}
      customSearchProps={searchProps}
      hasHelpText
      helpText={__('Manage hardware models for your hosts. Hardware models help categorize and organize hosts by their physical specifications.')}
      columns={columns}
      columnsToSortParams={columnsToSortParams}
      showCheckboxes={false}
    />
  );
};

export default HardwareModelsPage;