import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { Button, Hint, HintBody, Skeleton } from '@patternfly/react-core';
import { TableVariant, TableText, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import { translate as __ } from 'foremanReact/common/I18n';
import { selectAPIResponse } from 'foremanReact/redux/API/APISelectors';
import { SelectAllManager, useSet} from '../../../Table/TableHooks';
import IsoDate from 'foremanReact/components/common/dates/IsoDate';
import { urlBuilder } from 'foremanReact/common/urlHelpers';
import TableWrapper from '../../../../components/Table/TableWrapper';
import TdSelect from '../../../../components/SelectAllCheckbox/TdSelect';

import { ErrataType, ErrataSeverity } from '../../../../components/Errata';
import { getInstallableErrata } from '../HostErrata/HostErrataActions';
import { selectHostErrataStatus } from '../HostErrata/HostErrataSelectors';
import { HOST_ERRATA_KEY } from '../HostErrata/HostErrataConstants';
import './ErrataTab.scss';

export const ErrataTab = () => {
  const hostDetails = useSelector(state => selectAPIResponse(state, 'HOST_DETAILS'));
  const { id: hostId } = hostDetails;

  const actionButtons = <Button isDisabled> {__('Apply')} </Button>;

  const [searchQuery, updateSearchQuery] = useState('');
  const emptyContentTitle = __('This host does not have any installable errata.');
  const emptyContentBody = __('Installable errata will appear here when available.');
  const emptySearchTitle = __('No matching installable errata found');
  const emptySearchBody = __('Try changing your search settings.');
  const columnHeaders = [
    __('Errata'),
    __('Type'),
    __('Severity'),
    __('Synopsis'),
    __('Published Date'),
  ];

  const fetchItems = useCallback(
    params => getInstallableErrata(hostId, params),
    [hostId],
  );

  const response = useSelector(state => selectAPIResponse(state, HOST_ERRATA_KEY));
  const { results, ...metadata } = response;
  const status = useSelector(state => selectHostErrataStatus(state));

  const selectAll = new SelectAllManager(results, metadata, useSet([]))

  if (!hostId) return <Skeleton />;

  const rowActions = [
    {
      title: __('Apply via Katello agent'), disabled: true,
    },
    {
      title: __('Apply via remote execution'), disabled: true,
    },
    {
      title: __('Apply via customized remote execution'), disabled: true,
    },
  ];
  return (
    <div>
      <div id="errata-hint">
        <Hint>
          <HintBody>
            {__('Errata management functionality on this page is incomplete')}.
            <br />
            <Button component="a" variant="link" isInline href={urlBuilder(`content_hosts/${hostId}/errata`, '')}>
              {__('Visit the previous Errata page')}.
            </Button>
          </HintBody>
        </Hint>
      </div>
      <div id="errata-tab">
        <TableWrapper
          {...{
                metadata,
                emptyContentTitle,
                emptyContentBody,
                emptySearchTitle,
                emptySearchBody,
                status,
                actionButtons,
                searchQuery,
                updateSearchQuery,
                selectAll,
                }}
          additionalListeners={[hostId]}
          fetchItems={fetchItems}
          autocompleteEndpoint={`/hosts/${hostId}/errata/auto_complete_search`}
          foremanApiAutoComplete
          rowsCount={results?.length}
          variant={TableVariant.compact}
        >
          <Thead>
            <Tr>
              <Th />
              {columnHeaders.map(col =>
                <Th key={col}>{col}</Th>)}
              <Th />
            </Tr>
          </Thead>
          <Tbody>
            {results?.map((erratum, rowIndex) => {
                const {
                  id,
                  errata_id: errataId,
                  created_at: createdAt,
                  updated: publishedAt,
                  title,
                } = erratum;
                return (
                  <Tr key={`${id}_${createdAt}`}>
                    <TdSelect id = {id} rowIndex = {rowIndex} selectAll = {selectAll} />
                    <Td>
                      <a href={urlBuilder(`errata/${id}`, '')}>{errataId}</a>
                    </Td>
                    <Td><ErrataType {...erratum} /></Td>
                    <Td><ErrataSeverity {...erratum} /></Td>
                    <Td><TableText wrapModifier="truncate">{title}</TableText></Td>
                    <Td key={publishedAt}><IsoDate date={publishedAt} /></Td>
                    <Td
                      key={`rowActions-${id}`}
                      actions={{
                          items: rowActions,
                        }}
                    />
                  </Tr>
                );
              })
              }
          </Tbody>
        </TableWrapper>
      </div>
    </div>
  );
};

export default ErrataTab;
