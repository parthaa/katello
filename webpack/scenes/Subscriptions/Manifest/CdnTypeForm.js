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

const CdnTypeForm = ({type, cdnConfiguration:{type: cdnConfigurationType}}) => {
  const showUpdate = type !== cdnConfigurationType;
  const dispatch = useDispatch();
  const performUpdate = () => {
    dispatch(updateCdnConfiguration({
      type: 'cdn',
    }));
  }

  return (
    <>
      <div id="update-hint-cdn" className="margin-top-16">
        <p>
          <FormattedMessage
            id="cdn-configuration-type"
            defaultMessage={__("Red Hat content will be consumed from the {type}.")}
            values={{
                type: <strong>{__('Red Hat CDN')}</strong>,
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

      <FormGroup label={__('URL')}>
        <TextInput
          isReadOnly
          aria-label="cdn-url"
          type="text"
          value={CDN_URL}
        />
      </FormGroup>

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


CdnTypeForm.propTypes = {
  cdnConfiguration: PropTypes.shape({
    type: PropTypes.string
  }),
  type: PropTypes.string,
};

export default CdnTypeForm;
