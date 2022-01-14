import React, { useState } from 'react';
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
  Switch,
  TextInput,
  Tooltip,
  ToggleGroup,
  ToggleGroupItem,
  Hint,
  HintBody,
  HintFooter,
  HintTitle
} from '@patternfly/react-core';
import { CDN_URL } from './ManifestConstants';
import { translate as __ } from 'foremanReact/common/I18n';

import EditableTextInput from '../../../components/EditableTextInput';
import CdnTypeForm from './CdnTypeForm'
import AirGappedTypeForm from './AirGappedTypeForm'
import UpstreamServerTypeForm from './UpstreamServerTypeForm'
import {
  selectUpdatingCdnConfiguration,
} from '../../Organizations/OrganizationSelectors';

import { updateCdnConfiguration } from '../../Organizations/OrganizationActions';
import './CdnConfigurationForm.scss';
import { CDN, AIRGAPPED, UPSTREAM_SERVER, CDN_CONFIGURATION_TYPES,} from './CdnConfigurationConstants';

const CdnConfigurationForm = (props) => {
  const {
    contentCredentials,
    cdnConfiguration,
  } = props;

  const [type, setType] = useState(cdnConfiguration.type);
  const updatingCdnConfiguration = useSelector(state => selectUpdatingCdnConfiguration(state));


  const updateType = (connectionType) => {
    if (type !== connectionType)  {
      setType(connectionType);
    }
  }

  return (
    <div id="cdn-configuration">
        <ToggleGroup aria-label="Default with multiple selectable">
          <ToggleGroupItem text={CDN_CONFIGURATION_TYPES[CDN]} key={0} buttonId="cdn" isSelected={type === CDN} onChange={() => updateType(cdn)}  />
          <ToggleGroupItem text={CDN_CONFIGURATION_TYPES[UPSTREAM_SERVER]} key={1} buttonId="satellite" isSelected={type === UPSTREAM_SERVER} onChange={() => updateType(satellite)} />
          <ToggleGroupItem text={CDN_CONFIGURATION_TYPES[AIRGAPPED]} key={2} buttonId="airgapped" isSelected={type === AIRGAPPED} onChange={() => updateType(airgapped)}/>
        </ToggleGroup>

      { type === UPSTREAM_SERVER &&
        <UpstreamServerTypeForm type={type} cdnConfiguration={cdnConfiguration} contentCredentials={contentCredentials} />
      }

      { type === CDN &&
        <CdnTypeForm type={type} cdnConfiguration={cdnConfiguration}/>
      }
      { type === AIRGAPPED &&
        <AirGappedTypeForm  type={type} cdnConfiguration={cdnConfiguration}/>
      }
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
