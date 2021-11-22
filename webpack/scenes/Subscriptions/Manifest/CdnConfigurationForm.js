import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import {
  ActionGroup,
  Alert,
  Button,
  Form,
  FormAlert,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Switch,
  TextInput,
<<<<<<< HEAD
  Tooltip,
=======
  ToggleGroup,
  ToggleGroupItem,
  Hint,
  HintBody,
  HintFooter,
  HintTitle
>>>>>>> 3a84532c3a (Fixes #33951 - New settings for disconnected)
} from '@patternfly/react-core';
import { CDN_URL } from './ManifestConstants';
import { translate as __ } from 'foremanReact/common/I18n';

import EditableTextInput from '../../../components/EditableTextInput';

import {
  selectUpdatingCdnConfiguration,
} from '../../Organizations/OrganizationSelectors';

import { updateCdnConfiguration } from '../../Organizations/OrganizationActions';
import './CdnConfigurationForm.scss';

const SatelliteTypeForm = ({ contentCredentials, cdnConfiguration}) => {

}

const AirgappedTypeForm = ({ contentCredentials, cdnConfiguration}) => {

}

const CdnTypeForm = ({ contentCredentials, cdnConfiguration}) => {

}


const CdnConfigurationForm = (props) => {
  const {
    contentCredentials,
    cdnConfiguration,
  } = props;

  const dispatch = useDispatch();

  const [url, setUrl] = useState(cdnConfiguration.url);
  const [username, setUsername] = useState(cdnConfiguration.username);
  const [password, setPassword] = useState(null);
  const [organizationLabel, setOrganizationLabel] =
    useState(cdnConfiguration.upstream_organization_label);
  const [sslCaCredentialId, setSslCaCredentialId] = useState(cdnConfiguration.ssl_ca_credential_id);
  const [type, setType] = useState(cdnConfiguration.type);
  const updatingCdnConfiguration = useSelector(state => selectUpdatingCdnConfiguration(state));

  const [contentViewLabel, setContentViewLabel] =
    useState(cdnConfiguration.upstream_content_view_label);

  const [lifecycleEnvironmentLabel, setLifecycleEnvironmentLabel] =
    useState(cdnConfiguration.upstream_lifecycle_environment_label);

  const editPassword = (value) => {
    if (value === null) {
      setPassword('');
    } else {
      setPassword(value);
    }
  };
  const [cdn, satellite, airgapped] = ["cdn", "satellite", "airgapped"];
  const hasPassword = (cdnConfiguration.password_exists && password === null)
    || password?.length > 0;

  const typeTitles = {
    cdn: __("Red Hat CDN"),
    satellite: __("Satellite"),
    airgapped: __("Air-Gapped")
  }

  const requiresValidation = false;
  //!airgapped && (username || password || organizationLabel || sslCaCredentialId);

  const requiredFields = [username, organizationLabel, sslCaCredentialId];

  if (!hasPassword) {
    requiredFields.push(password);
  }

  const validated = cdnConfiguration.type === satellite ?
    !requiredFields.some(field => !field) :
    true;

  const performUpdate = () => {
    dispatch(updateCdnConfiguration({
      url,
      username,
      password,
      upstream_organization_label: organizationLabel,
      ssl_ca_credential_id: sslCaCredentialId,
      type: type,
    }));
  };

  const updateToAirGapped = () => {
    dispatch(updateCdnConfiguration({
      type: type,
    }));
  };

  const updateToCdn = () => {
    dispatch(updateCdnConfiguration({
      type: type,
    }));
  };


  const updateType = (connectionType) => {
    if (type !== connectionType)  {
      setType(connectionType);
    }
  }

  const satelliteUrl = cdnConfiguration.type === satellite ? url : '';

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
        <ToggleGroup aria-label="Default with multiple selectable">
          <ToggleGroupItem text={typeTitles[cdn]} key={0} buttonId="cdn" isSelected={type === cdn} onChange={() => updateType(cdn)}  />
          <ToggleGroupItem text={typeTitles[satellite]} key={1} buttonId="satellite" isSelected={type === satellite} onChange={() => updateType(satellite)} />
          <ToggleGroupItem text={typeTitles[airgapped]} key={2} buttonId="airgapped" isSelected={type === airgapped} onChange={() => updateType(airgapped)}/>
        </ToggleGroup>

      { type === airgapped && type === cdnConfiguration.type &&
          <div className="margin-0-24 margin-top-16">
            <Hint>
              <HintBody>
                  {__('The CDN configuration type is currently set to  Air-Gapped')}.<br/>
                  {__('Red Hat Repositories are to be enabled and updated only via the Import/Export process.')}.
              </HintBody>
            </Hint>
          </div>
      }

      { type === cdn &&
        <FormGroup
          label={__('URL')}
        >
          <TextInput
          isDisabled
            aria-label="cdn-url"
            type="text"
            value={CDN_URL}
          />
        </FormGroup>
      }
      { type !== cdnConfiguration.type && type === satellite &&
          <div className="margin-0-24 margin-top-16">
            <Hint>
              <HintBody>
                  {__('Provide the required information and update if your respositories are to consume Red Hat content from another Satellite.')}
              </HintBody>
            </Hint>
          </div>
      }
      { type === satellite &&
        <>
        <FormGroup
          label={__('URL')}
          isRequired={type === satellite}
        >
          <TextInput
            isDisabled={type !== satellite}
            aria-label="cdn-url"
            type="text"
            value={satelliteUrl || ''}
            onChange={value => setUrl(value)}
          />
        </FormGroup>
        <FormGroup
          label={__('Username')}
          isRequired={type === satellite}
        >
          <TextInput
            isDisabled={type !== satellite}
            aria-label="cdn-username"
            type="text"
            value={username || ''}

            onChange={value => setUsername(value)}
          />
        </FormGroup>
        <FormGroup
          label={__('Password')}
          disabled={type !== satellite}
          isRequired={type === satellite}
        >
          <EditableTextInput
            attribute="cdn-password"
            value={password}
            isPassword
            hasPassword={hasPassword}
            onEdit={editPassword}
            disabled={type !== satellite}
          />
        </FormGroup>
        <FormGroup
          label={__('Organization Label')}
          isRequired={type === satellite}
        >
          <TextInput
            aria-label="cdn-organization-label"
            type="text"
            value={organizationLabel || ''}
<<<<<<< HEAD
            onChange={setOrganizationLabel}
=======
            onChange={value => setOrganizationLabel(value)}
            isDisabled={type !== satellite}
>>>>>>> 3a84532c3a (Fixes #33951 - New settings for disconnected)
          />
        </FormGroup>
        <FormGroup
          label={__('Lifecycle Environment Label')}
        >
          <TextInput
            aria-label="cdn-lifecycle-environment-label"
            type="text"
            value={lifecycleEnvironmentLabel || ''}
            onChange={setLifecycleEnvironmentLabel}
          />
          <Tooltip>
            {__('Leave blank if consuming Red Hat Content from the Library lifecycle environment or CDN ')}
          </Tooltip>
        </FormGroup>
        <FormGroup
          label={__('Content View Label')}
        >
          <TextInput
            aria-label="cdn-content-view-label"
            type="text"
            value={contentViewLabel || ''}
            onChange={setContentViewLabel}
          />
          <Tooltip>
            {__('Leave blank if consuming Red Hat Content from the Default Content View or CDN ')}
          </Tooltip>

        </FormGroup>
        <FormGroup
          label={__('SSL CA Content Credential')}
          isRequired={type === satellite}
        >
          <FormSelect
            aria-label="cdn-ssl-ca-content-credential"
            value={sslCaCredentialId || ''}
            onChange={value => setSslCaCredentialId(value)}
            isDisabled={type !== satellite}
          >
            <FormSelectOption label={__('Select one')} isDisabled isPlaceholder />
            {contentCredentials.map(cred =>
              <FormSelectOption data-testid="ssl-ca-content-credential-option" key={cred.id} value={cred.id} label={cred.name} />)}
          </FormSelect>
        </FormGroup>
        </>
        }
        { type !== cdnConfiguration.type && type === cdn &&
            <div id="update-hint" className="margin-0-24 margin-top-16">
              <Hint>
                <HintBody>
                    {__('Update if your respositories are to consume Red Hat content directly from the CDN.')}.
                </HintBody>
                <HintFooter>
                  <Button
                    aria-label="update-cdn-configuration"
                    variant="secondary"
                    onClick={updateToCdn}
                    isDisabled={updatingCdnConfiguration || type === cdnConfiguration.type}
                    isLoading={updatingCdnConfiguration}
                  >
                    {__('Update to CDN')}
                  </Button>
                </HintFooter>
              </Hint>
            </div>
        }

        { type !== cdnConfiguration.type && type === airgapped &&
            <div className="margin-0-24 margin-top-16">
              <Hint>
                <HintBody>
                    {__('Update if you respositories are to consume Red Hat content only via Import/Export.')}. <br/>
                </HintBody>
                <HintFooter>
                  <Button
                    aria-label="update-cdn-configuration"
                    variant="secondary"
                    onClick={updateToAirGapped}
                    isDisabled={updatingCdnConfiguration || type === cdnConfiguration.type}
                    isLoading={updatingCdnConfiguration}
                  >
                    {__('Update to Air-Gapped')}
                  </Button>
                </HintFooter>
              </Hint>
            </div>
        }

        {  type === satellite &&
              <ActionGroup>
                <Button
                  aria-label="update-cdn-configuration"
                  variant="secondary"
                  onClick={performUpdate}
                  isDisabled={updatingCdnConfiguration || type === cdnConfiguration.type}
                  isLoading={updatingCdnConfiguration}
                >
                  {__('Update')}
                </Button>
              </ActionGroup>
        }
      </Form>
    </div>
  );
};

CdnConfigurationForm.propTypes = {
  contentCredentials: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
  })),
  cdnConfiguration: PropTypes.shape({
    url: PropTypes.string,
    username: PropTypes.string,
    upstream_organization_label: PropTypes.string,
    upstream_content_view_label: PropTypes.string,
    upstream_lifecycle_environment_label: PropTypes.string,
    ssl_ca_credential_id: PropTypes.number,
    password_exists: PropTypes.bool,
    airgapped: PropTypes.bool,
  }),
};

CdnConfigurationForm.defaultProps = {
  contentCredentials: [],
  cdnConfiguration: {},
};

export default CdnConfigurationForm;
