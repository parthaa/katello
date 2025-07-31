import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { translate as __ } from 'foremanReact/common/I18n';
import { isEmpty } from 'lodash';
import {
  Grid,
  Row,
  Col,
  Button,
  Alert,
} from 'patternfly-react';
import {
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Spinner,
} from '@patternfly/react-core';

import LoadingState from '../../components/LoadingState';
import SyncManagementToolbar from './components/SyncManagementToolbar';
import ProductsTable from './components/ProductsTable';
import EmptyState from './components/EmptyState';

class SyncManagementPage extends Component {
  componentDidMount() {
    const { loadSyncManagement } = this.props;
    loadSyncManagement();
  }

  componentWillUnmount() {
    // Clear any running polling intervals
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  handleSyncSelected = () => {
    const { startSync, selectedRepositories } = this.props;
    if (selectedRepositories.length > 0) {
      startSync(selectedRepositories);
    }
  };

  handleSelectRepositories = (repositoryIds) => {
    const { updateSelectedRepositories } = this.props;
    updateSelectedRepositories(repositoryIds);
  };

  handleCancelSync = (repositoryId) => {
    const { cancelSync } = this.props;
    cancelSync(repositoryId);
  };

  handleToggleProduct = (productId) => {
    const { toggleProductExpansion } = this.props;
    toggleProductExpansion(productId);
  };

  renderToolbar = () => {
    const {
      selectedRepositories,
      canSync,
      isSyncing,
      permissions,
      totalRepositories,
    } = this.props;

    return (
      <SyncManagementToolbar
        selectedCount={selectedRepositories.length}
        totalCount={totalRepositories}
        canSync={canSync}
        isSyncing={isSyncing}
        syncable={permissions.syncable}
        onSyncSelected={this.handleSyncSelected}
        onSelectRepositories={this.handleSelectRepositories}
      />
    );
  };

  renderContent = () => {
    const {
      products,
      selectedRepositories,
      expandedProducts,
      permissions,
      runningSyncs,
    } = this.props;

    if (isEmpty(products)) {
      return <EmptyState />;
    }

    return (
      <ProductsTable
        products={products}
        selectedRepositories={selectedRepositories}
        expandedProducts={expandedProducts}
        syncable={permissions.syncable}
        runningSyncs={runningSyncs}
        onSelectRepositories={this.handleSelectRepositories}
        onCancelSync={this.handleCancelSync}
        onToggleProduct={this.handleToggleProduct}
      />
    );
  };

  render() {
    const {
      loading,
      error,
      organization,
    } = this.props;

    if (loading) {
      return <LoadingState />;
    }

    return (
      <div className="sync-management-page">
        <Grid fluid>
          <Row>
            <Col xs={12}>
              <Title headingLevel="h1" size="2xl">
                {__('Sync Status')}
              </Title>
              {organization.name && (
                <p className="text-muted">
                  {__('Organization: %s', organization.name)}
                </p>
              )}
            </Col>
          </Row>

          {error && (
            <Row>
              <Col xs={12}>
                <Alert type="error">
                  {error}
                </Alert>
              </Col>
            </Row>
          )}

          <Row>
            <Col xs={12}>
              {this.renderToolbar()}
            </Col>
          </Row>

          <Row>
            <Col xs={12}>
              {this.renderContent()}
            </Col>
          </Row>
        </Grid>
      </div>
    );
  }
}

SyncManagementPage.propTypes = {
  // Data
  products: PropTypes.array,
  selectedRepositories: PropTypes.array,
  expandedProducts: PropTypes.object,
  permissions: PropTypes.object,
  organization: PropTypes.object,
  
  // Computed data
  canSync: PropTypes.bool,
  totalRepositories: PropTypes.number,
  runningSyncs: PropTypes.array,
  
  // State
  loading: PropTypes.bool,
  isSyncing: PropTypes.bool,
  error: PropTypes.string,
  
  // Actions
  loadSyncManagement: PropTypes.func.isRequired,
  startSync: PropTypes.func.isRequired,
  cancelSync: PropTypes.func.isRequired,
  updateSelectedRepositories: PropTypes.func.isRequired,
  toggleProductExpansion: PropTypes.func.isRequired,
};

SyncManagementPage.defaultProps = {
  products: [],
  selectedRepositories: [],
  expandedProducts: {},
  permissions: {},
  organization: {},
  canSync: false,
  totalRepositories: 0,
  runningSyncs: [],
  loading: false,
  isSyncing: false,
  error: null,
};

export default SyncManagementPage;