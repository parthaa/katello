import React, { useState, useCallback } from 'react';
import { Skeleton, Button } from '@patternfly/react-core';
import { translate as __ } from 'foremanReact/common/I18n';
import { TableVariant, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import { useSelector, useDispatch } from 'react-redux';
import { selectAPIResponse } from 'foremanReact/redux/API/APISelectors';
import TableWrapper from '../../../Table/TableWrapper';
import { SelectAllManager, useSet } from '../../../Table/TableHooks';
import { getHostTraces, resolveHostTraces } from './HostTracesActions';
import { selectHostTracesStatus } from './HostTracesSelectors';
import TdSelect from '../../../../components/SelectAllCheckbox/TdSelect';

import './TracesTab.scss';

const TracesTab = () => {
  const [searchQuery, updateSearchQuery] = useState('');
  const hostDetails = useSelector(state => selectAPIResponse(state, 'HOST_DETAILS'));
  const dispatch = useDispatch();
  const { id: hostId } = hostDetails;
  const emptyContentTitle = __('This host currently does not have traces.');
  const emptyContentBody = __('Add traces by installing katello-host-tools-tracer, and applying updates.');
  const emptySearchTitle = __('No matching traces found');
  const emptySearchBody = __('Try changing your search settings.');
  const fetchItems = useCallback(
    params =>
      (hostId ? getHostTraces(hostId, params) : null),
    [hostId],
  );
  const response = useSelector(state => selectAPIResponse(state, 'HOST_TRACES'));
  const { results, ...meta } = response;
  const selectAll = new SelectAllManager(results, meta, useSet([]))

  const onRestartApp = () => {
    dispatch(resolveHostTraces(hostId, { trace_ids: [...selectAll.selectionSet] }));
    selectAll.clear();
    const params = { page: meta.page, per_page: meta.per_page, search: meta.search };
    dispatch(getHostTraces(hostId, params));
  };
  const actionButtons = (
    <Button
      variant="secondary"
      isDisabled={!selectAll.selectionSet.size}
      onClick={onRestartApp}
    >
      {__('Restart app')}
    </Button>
  );
  const status = useSelector(state => selectHostTracesStatus(state));
  if (!hostId) return <Skeleton />;

  /* eslint-disable max-len */
  return (
    <div id="traces-tab">
      <h3>{__('Tracer helps administrators identify applications that need to be restarted after a system is patched.')}</h3>
      <TableWrapper
        actionButtons={actionButtons}
        searchQuery={searchQuery}
        emptyContentBody={emptyContentBody}
        emptyContentTitle={emptyContentTitle}
        emptySearchBody={emptySearchBody}
        emptySearchTitle={emptySearchTitle}
        updateSearchQuery={updateSearchQuery}
        fetchItems={fetchItems}
        autocompleteEndpoint={`/hosts/${hostId}/traces/auto_complete_search`}
        foremanApiAutoComplete
        selectAll={selectAll]}
        rowsCount={results?.length}
        variant={TableVariant.compact}
        status={status}
        metadata={meta}
      >
        <Thead>
          <Tr>
            <Th />
            <Th>{__('Application')}</Th>
            <Th>{__('Type')}</Th>
            <Th>{__('Helper')}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {results?.map((result, rowIndex) => {
          const {
            id,
            application,
            helper,
            app_type: appType,
          } = result;
          return (
            <Tr key={id} >
              <TdSelect id = {id}
                        selectAll = {selectAll}
                        rowIndex = {rowIndex}
                        props={{'aria-label': `check-${application}`}},
              />
              <Td>{application}</Td>
              <Td>{appType}</Td>
              <Td>{helper}</Td>
            </Tr>
          );
         })
         }
        </Tbody>
      </TableWrapper>
    </div>
  );
};
/* eslint-enable max-len */
export default TracesTab;
