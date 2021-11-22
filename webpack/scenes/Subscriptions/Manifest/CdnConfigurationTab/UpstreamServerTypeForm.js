import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import {
  ActionGroup,
  Alert,
  Button,
  Form,
  FormAlert,
  FormGroup,
  FormSelect,
  FormSelectOption,
  TextInput,
  Text,
} from '@patternfly/react-core';

import { translate as __ } from 'foremanReact/common/I18n';

import { UPSTREAM_SERVER, DEFAULT_CONTENT_VIEW_LABEL, DEFAULT_LIFECYCLE_ENVIRONMENT_LABEL } from './CdnConfigurationConstants';
import EditableTextInput from '../../../../components/EditableTextInput';

import {
  selectUpdatingCdnConfiguration,
} from '../../../Organizations/OrganizationSelectors';

import { updateCdnConfiguration } from '../../../Organizations/OrganizationActions';
import './CdnConfigurationForm.scss';

const UpstreamServerTypeForm = ({
  type, contentCredentials, cdnConfiguration, onUpdate,
}) => {
  const dispatch = useDispatch();

  const [url, setUrl] = useState(cdnConfiguration.url);
  const [username, setUsername] = useState(cdnConfiguration.username);
  const [password, setPassword] = useState(null);
  const [organizationLabel, setOrganizationLabel] =
    useState(cdnConfiguration.upstream_organization_label);
  const [sslCaCredentialId, setSslCaCredentialId] = useState(cdnConfiguration.ssl_ca_credential_id);
  const updatingCdnConfiguration = useSelector(state => selectUpdatingCdnConfiguration(state));

  const [contentViewLabel, setContentViewLabel] =
    useState(cdnConfiguration.upstream_content_view_label);

  const [lifecycleEnvironmentLabel, setLifecycleEnvironmentLabel] =
    useState(cdnConfiguration.upstream_lifecycle_environment_label);

  const [updateEnabled, setUpdateEnabled] =
    useState(type !== cdnConfiguration.type);

  const firstUpdate = useRef(true);
  useEffect(() => {
    if (firstUpdate.current) {
      firstUpdate.current = false;
      return;
    }
    setUpdateEnabled(true);
  }, [url, username, password, organizationLabel,
    contentViewLabel, lifecycleEnvironmentLabel,
    sslCaCredentialId]);

  const editPassword = (value) => {
    if (value === null) {
      setPassword('');
    } else {
      setPassword(value);
    }
  };
  const hasPassword = (cdnConfiguration.password_exists && password === null)
    || password?.length > 0;

  const requiredFields = [username, organizationLabel, sslCaCredentialId];

  if (!hasPassword) {
    requiredFields.push(password);
  }

  const validated = cdnConfiguration.type !== UPSTREAM_SERVER ||
                      !requiredFields.some(field => !field);

  const performUpdate = () => {
    setUpdateEnabled(false);
    dispatch(updateCdnConfiguration({
      url,
      username,
      password,
      upstream_organization_label: organizationLabel,
      ssl_ca_credential_id: sslCaCredentialId,
      upstream_content_view_label: contentViewLabel,
      upstream_lifecycle_environment_label: lifecycleEnvironmentLabel,
      type: UPSTREAM_SERVER,
    }, onUpdate));
  };

  return (
    <div id="cdn-configuration">
      <Form isHorizontal>
        { !validated && (
          <FormAlert>
            <Alert
              variant="danger"
              title={__('Username, Password, Organization Label, and SSL CA Content Credential must be provided together.')}
              aria-live="polite"
              isInline
            />
          </FormAlert>
        )}

        <div id="update-hint-upstream-server" className="margin-top-16">
          <Text>
            <FormattedMessage
              id="cdn-configuration-type"
              defaultMessage={__('Red Hat content will be consumed from an {type}.')}
              values={{
                type: <strong>{__('Upstream Foreman Server')}</strong>,
            }}
            />
            <br />
            {type !== cdnConfiguration.type &&
            <FormattedMessage
              id="cdn-configuration-type-upstream-server"
              defaultMessage={__('Provide the required information and click {update} below to save changes.')}
              values={{
                  update: <strong>{__('Update')}</strong>,
              }}
            />
          }
          </Text>
        </div>
        <FormGroup
          label={__('URL')}
          isRequired
        >
          <TextInput
            aria-label="cdn-url"
            type="text"
            value={url || ''}
            onChange={value => setUrl(value)}
          />
        </FormGroup>
        <FormGroup
          label={__('Username')}
          isRequired
        >
          <TextInput
            aria-label="cdn-username"
            type="text"
            value={username || ''}
            onChange={value => setUsername(value)}
          />
        </FormGroup>
        <FormGroup
          label={__('Password')}
          isRequired
        >
          <EditableTextInput
            attribute="cdn-password"
            value={password}
            isPassword
            hasPassword={hasPassword}
            onEdit={editPassword}
          />
        </FormGroup>
        <FormGroup
          label={__('Organization Label')}
          isRequired
        >
          <TextInput
            aria-label="cdn-organization-label"
            type="text"
            value={organizationLabel || ''}
            onChange={setOrganizationLabel}
          />
        </FormGroup>
        <FormGroup
          label={__('Lifecycle Environment Label')}
        >
          <TextInput
            aria-label="cdn-lifecycle-environment-label"
            type="text"
            value={lifecycleEnvironmentLabel || DEFAULT_LIFECYCLE_ENVIRONMENT_LABEL}
            onChange={setLifecycleEnvironmentLabel}
          />
        </FormGroup>
        <FormGroup
          label={__('Content View Label')}
        >
          <TextInput
            aria-label="cdn-content-view-label"
            type="text"
            value={contentViewLabel || DEFAULT_CONTENT_VIEW_LABEL}
            onChange={setContentViewLabel}
          />
        </FormGroup>
        <FormGroup
          label={__('SSL CA Content Credential')}
          isRequired
        >
          <FormSelect
            aria-label="cdn-ssl-ca-content-credential"
            value={sslCaCredentialId || ''}
            onChange={value => setSslCaCredentialId(value)}
          >
            <FormSelectOption label={__('Select one')} isDisabled isPlaceholder />
            {contentCredentials.map(cred =>
              <FormSelectOption data-testid="ssl-ca-content-credential-option" key={cred.id} value={cred.id} label={cred.name} />)}
          </FormSelect>
        </FormGroup>

        <ActionGroup>
          <Button
            aria-label="update-cdn-configuration"
            variant="secondary"
            onClick={performUpdate}
            isDisabled={updatingCdnConfiguration || !updateEnabled}
          >
            {__('Update')}
          </Button>
        </ActionGroup>
      </Form>
    </div>
  );
};

UpstreamServerTypeForm.propTypes = {
  type: PropTypes.string.isRequired,
  contentCredentials: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
  })),
  cdnConfiguration: PropTypes.shape({
    type: PropTypes.string.isRequired,
    url: PropTypes.string,
    username: PropTypes.string,
    upstream_organization_label: PropTypes.string,
    upstream_content_view_label: PropTypes.string,
    upstream_lifecycle_environment_label: PropTypes.string,
    ssl_ca_credential_id: PropTypes.number,
    password_exists: PropTypes.bool,
  }),
  onUpdate: PropTypes.func.isRequired,
};

UpstreamServerTypeForm.defaultProps = {
  contentCredentials: [],
  cdnConfiguration: {},
};

export default UpstreamServerTypeForm;
