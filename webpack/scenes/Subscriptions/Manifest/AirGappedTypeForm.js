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
import { CDN_URL,CDN, AIRGAPPED, CDN_CONFIGURATION_TYPES, CDN_CONFIGURATION_TYPE_MESSAGES, CDN_CONFIGURATION_TYPE_VALUES, CDN_CONFIGURATION_TYPE_UPDATE_MESSAGES } from './CdnConfigurationConstants';
import { translate as __ } from 'foremanReact/common/I18n';
import {
  selectUpdatingCdnConfiguration,
} from '../../Organizations/OrganizationSelectors';

import { updateCdnConfiguration } from '../../Organizations/OrganizationActions';
import './CdnConfigurationForm.scss';

const AirGappedTypeForm = ({type, cdnConfiguration:{type: cdnConfigurationType}}) => {
  const showUpdate = type !== cdnConfigurationType;
  const dispatch = useDispatch();
  const performUpdate = () => {
    dispatch(updateCdnConfiguration({
      type: AIRGAPPED,
    }));
  }

  return (
    <>
      <div id="update-hint-cdn" className="margin-top-16">
        <p>
          <FormattedMessage
            id="cdn-configuration-type"
            defaultMessage={__("Red Hat content  will be enabled and consumed via the {type} process.")}
            values={{
                type: <strong>{__('Import/Export')}</strong>,
            }}
          />
          <br/>
          {showUpdate &&
            <FormattedMessage
              id="cdn-configuration-type-cdn"
              defaultMessage={__("Click {update} below to save changes.")}
              values={{
                  update: <strong>{__('Update')}</strong>,
              }}
            />
        }
        </p>
      </div>

      <ActionGroup>
        <Button
          aria-label="update-cdn-configuration"
          variant="secondary"
          onClick={performUpdate}
          isDisabled={!showUpdate}
        >
          {__('Update')}
        </Button>
      </ActionGroup>
    </>
  );
}


AirGappedTypeForm.propTypes = {
  cdnConfiguration: PropTypes.shape({
    type: PropTypes.string
  }),
  type: PropTypes.string,
};

export default AirGappedTypeForm;
