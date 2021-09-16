import React from 'react';
import PropTypes from 'prop-types';
import { SelectAllManager } from '../Table/TableHooks'
import { Td } from '@patternfly/react-table';

const TdSelect = ({
  selectAll,
  variant,
  props,
  rowIndex,
  disable,
  id,
}) =>
  (<Td select={{
      disable: disable,
      isSelected: selectAll.isSelected(id),
      onSelect: (event, isSelected) => selectAll.onRowSelect(isSelected, id),
      rowIndex: rowIndex,
      variant: variant,
      props: props
      }}
    />);


// TODO: uncomment selectAll and totalCount when Select All is implemented
TdSelect.propTypes = {
  selectAll: PropTypes.instanceOf(SelectAllManager).isRequired,
  variant: PropTypes.string.isRequired,
  props: PropTypes.shape({}),
  rowIndex: PropTypes.number.isRequired,
  disable: PropTypes.bool.isRequired,
  id: PropTypes.any.isRequired,
};

TdSelect.defaultProps = {
  props: { },
  variant: 'checkbox',
  disable: false,
};

export default TdSelect;
