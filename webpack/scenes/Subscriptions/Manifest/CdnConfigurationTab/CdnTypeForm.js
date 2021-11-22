import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import {
  ActionGroup,
  Button,
  Form,
  FormGroup,
  TextInput,
  Text,
} from '@patternfly/react-core';
import { translate as __ } from 'foremanReact/common/I18n';
import { CDN_URL, CDN } from './CdnConfigurationConstants';
import { updateCdnConfiguration } from '../../../Organizations/OrganizationActions';
import './CdnConfigurationForm.scss';

const CdnTypeForm = ({ showUpdate, onUpdate }) => {
  const dispatch = useDispatch();
  const performUpdate = () => {
    dispatch(updateCdnConfiguration({
      type: CDN,
    }, onUpdate));
  };

  return (
    <Form isHorizontal>
      <div id="update-hint-cdn" className="margin-top-16">
        <Text>
          <FormattedMessage
            id="cdn-configuration-type"
            defaultMessage={__('Red Hat content will be consumed from the {type}.')}
            values={{
                  type: <strong>{__('Red Hat CDN')}</strong>,
              }}
          />
          <br />
          {showUpdate &&
          <FormattedMessage
            id="cdn-configuration-type-cdn"
            defaultMessage={__('Click {update} below to save changes.')}
            values={{
                    update: <strong>{__('Update')}</strong>,
                }}
          />
          }
        </Text>
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
    </Form>

  );
};


CdnTypeForm.propTypes = {
  showUpdate: PropTypes.bool.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default CdnTypeForm;
