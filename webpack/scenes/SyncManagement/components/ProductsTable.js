import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { translate as __ } from 'foremanReact/common/I18n';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  ExpandableRowContent,
} from '@patternfly/react-table';
import {
  Checkbox,
  Progress,
  Button,
  Label,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import {
  AngleDownIcon,
  AngleRightIcon,
  TimesIcon,
} from '@patternfly/react-icons';

import { SYNC_STATUS, CONTENT_TYPES } from '../SyncManagementConstants';

const ProductsTable = ({
  products,
  selectedRepositories,
  expandedProducts,
  syncable,
  runningSyncs,
  onSelectRepositories,
  onCancelSync,
  onToggleProduct,
}) => {
  const columnNames = {
    expand: '',
    select: '',
    product: __('Product'),
    startTime: __('Start Time'),
    duration: __('Duration'),
    details: __('Details'),
    result: __('Result'),
  };

  const isRepositorySelected = (repoId) => selectedRepositories.includes(repoId);

  const handleProductToggle = (productId) => {
    onToggleProduct(productId);
  };

  const handleRepositorySelect = (repoId, checked) => {
    let newSelection;
    if (checked) {
      newSelection = [...selectedRepositories, repoId];
    } else {
      newSelection = selectedRepositories.filter(id => id !== repoId);
    }
    onSelectRepositories(newSelection);
  };

  const handleProductSelect = (product, checked) => {
    const repoIds = product.repositories.map(repo => repo.id);
    let newSelection;
    
    if (checked) {
      newSelection = [...new Set([...selectedRepositories, ...repoIds])];
    } else {
      newSelection = selectedRepositories.filter(id => !repoIds.includes(id));
    }
    onSelectRepositories(newSelection);
  };

  const isProductSelected = (product) => {
    const repoIds = product.repositories.map(repo => repo.id);
    return repoIds.every(id => selectedRepositories.includes(id));
  };

  const isProductPartiallySelected = (product) => {
    const repoIds = product.repositories.map(repo => repo.id);
    const selected = repoIds.filter(id => selectedRepositories.includes(id));
    return selected.length > 0 && selected.length < repoIds.length;
  };

  const renderSyncStatus = (repository) => {
    const { state, raw_state, is_running, progress } = repository;

    if (is_running && progress?.progress) {
      return (
        <Flex alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>
            <Progress
              value={progress.progress}
              title={__('Syncing')}
              size="sm"
            />
          </FlexItem>
          {syncable && (
            <FlexItem>
              <Button
                variant="link"
                onClick={() => onCancelSync(repository.id)}
                icon={<TimesIcon />}
                iconPosition="right"
                isSmall
              >
                {__('Cancel')}
              </Button>
            </FlexItem>
          )}
        </Flex>
      );
    }

    const getStatusVariant = (status) => {
      switch (status) {
        case SYNC_STATUS.STOPPED:
          return 'blue';
        case SYNC_STATUS.ERROR:
          return 'red';
        case SYNC_STATUS.RUNNING:
          return 'blue';
        case SYNC_STATUS.CANCELED:
          return 'orange';
        case SYNC_STATUS.NEVER_SYNCED:
          return 'grey';
        default:
          return 'grey';
      }
    };

    return (
      <Label color={getStatusVariant(raw_state)}>
        {state || __('Unknown')}
      </Label>
    );
  };

  const renderContentTypeIcon = (contentType) => {
    // This would typically use icons specific to each content type
    // For now, we'll just return the content type as text
    return (
      <Label color="blue" isCompact>
        {contentType || 'unknown'}
      </Label>
    );
  };

  const renderRepositoryRow = (repository, productId) => (
    <Tr key={`repo-${repository.id}`} className="repository-row">
      <Td />
      <Td>
        {syncable && (
          <Checkbox
            id={`repo-${repository.id}`}
            isChecked={isRepositorySelected(repository.id)}
            onChange={(checked) => handleRepositorySelect(repository.id, checked)}
          />
        )}
      </Td>
      <Td>
        <Flex alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>{renderContentTypeIcon(repository.content_type)}</FlexItem>
          <FlexItem>{repository.name}</FlexItem>
        </Flex>
      </Td>
      <Td>{repository.start_time || __('Never')}</Td>
      <Td>{repository.duration || __('-')}</Td>
      <Td>{repository.display_size || __('-')}</Td>
      <Td>{renderSyncStatus(repository)}</Td>
    </Tr>
  );

  const renderProductRow = (product, index) => {
    const isExpanded = expandedProducts[product.id];
    const isSelected = isProductSelected(product);
    const isPartiallySelected = isProductPartiallySelected(product);

    return (
      <React.Fragment key={product.id}>
        <Tr className={`product-row ${product.redhat ? 'redhat-product' : 'custom-product'}`}>
          <Td
            expand={{
              rowIndex: index,
              isExpanded,
              onToggle: () => handleProductToggle(product.id),
            }}
          />
          <Td>
            {syncable && product.repositories.length > 0 && (
              <Checkbox
                id={`product-${product.id}`}
                isChecked={isSelected}
                isIndeterminate={isPartiallySelected}
                onChange={(checked) => handleProductSelect(product, checked)}
              />
            )}
          </Td>
          <Td>
            <Flex direction={{ default: 'column' }}>
              <FlexItem>
                <strong>{product.name}</strong>
                {product.redhat && (
                  <Label color="red" isCompact className="ml-2">
                    {__('Red Hat')}
                  </Label>
                )}
              </FlexItem>
              {product.description && (
                <FlexItem>
                  <small className="text-muted">{product.description}</small>
                </FlexItem>
              )}
              {product.sync_plan && (
                <FlexItem>
                  <small>
                    {__('Sync Plan: %s', product.sync_plan)}
                  </small>
                </FlexItem>
              )}
            </Flex>
          </Td>
          <Td>{__('%s repositories', product.repositories.length)}</Td>
          <Td>-</Td>
          <Td>-</Td>
          <Td>
            <Label color="blue">
              {product.sync_state || __('Unknown')}
            </Label>
          </Td>
        </Tr>
        {isExpanded && (
          <Tr isExpanded={isExpanded}>
            <Td colSpan={7}>
              <ExpandableRowContent>
                <Table variant="compact" borders={false}>
                  <Tbody>
                    {product.repositories.map(repo => renderRepositoryRow(repo, product.id))}
                  </Tbody>
                </Table>
              </ExpandableRowContent>
            </Td>
          </Tr>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="products-table">
      <Table variant="compact">
        <Thead>
          <Tr>
            <Th width={10}>{columnNames.expand}</Th>
            {syncable && <Th width={10}>{columnNames.select}</Th>}
            <Th>{columnNames.product}</Th>
            <Th>{columnNames.startTime}</Th>
            <Th>{columnNames.duration}</Th>
            <Th>{columnNames.details}</Th>
            <Th>{columnNames.result}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {products.map((product, index) => renderProductRow(product, index))}
        </Tbody>
      </Table>
    </div>
  );
};

ProductsTable.propTypes = {
  products: PropTypes.array.isRequired,
  selectedRepositories: PropTypes.array.isRequired,
  expandedProducts: PropTypes.object.isRequired,
  syncable: PropTypes.bool.isRequired,
  runningSyncs: PropTypes.array.isRequired,
  onSelectRepositories: PropTypes.func.isRequired,
  onCancelSync: PropTypes.func.isRequired,
  onToggleProduct: PropTypes.func.isRequired,
};

export default ProductsTable;