import React from 'react';
import { translate as __ } from 'foremanReact/common/I18n';
import {
  EmptyState as PfEmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  Title,
  Button,
} from '@patternfly/react-core';
import { RepositoryIcon } from '@patternfly/react-icons';

const EmptyState = () => (
  <PfEmptyState>
    <EmptyStateIcon icon={RepositoryIcon} />
    <Title headingLevel="h4" size="lg">
      {__('No repositories available')}
    </Title>
    <EmptyStateBody>
      {__('There are no products or repositories enabled. Try enabling repositories to see sync status information.')}
    </EmptyStateBody>
    <Button
      variant="primary"
      component="a"
      href="/products"
      data-no-turbolink="true"
    >
      {__('Manage Custom Products')}
    </Button>
    <Button
      variant="link"
      component="a"
      href="/redhat_repositories"
      data-no-turbolink="true"
    >
      {__('Enable Red Hat Repositories')}
    </Button>
  </PfEmptyState>
);

export default EmptyState;