import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { SelectAllManager } from '../Table/TableHooks'
import { Dropdown, DropdownToggle, DropdownToggleCheckbox,
  DropdownItem } from '@patternfly/react-core';
import { translate as __ } from 'foremanReact/common/I18n';

import './SelectAllCheckbox.scss';

const SelectAllCheckbox = ({
  selectAll,
  pageRowCount,
}) => {
  const [isSelectAllChecked, setSelectAllChecked] = useState(null);
  const [isSelectAllDropdownOpen, setSelectAllDropdownOpen] = useState(false);

  // Checkbox states: false = unchecked, null = partially-checked, true = checked
  // Flow: All are selected -> click -> none are selected
  // Some are selected -> click -> none are selected
  // None are selected -> click -> page is selected
  const onSelectAllCheckboxChange = () => {
    if (isSelectAllChecked === false) {
      return selectAll.selectPage();
    }
    return selectAll.selectNone();
  };
  const onSelectAllDropdownToggle = () => setSelectAllDropdownOpen(isOpen => !isOpen);

  // TODO: uncomment when Select All is implemented in Katello API
  // const handleSelectAll = () => {
  //   setSelectAllDropdownOpen(false);
  //   selectAll();
  // };
  const handleSelectPage = () => {
    setSelectAllDropdownOpen(false);
    selectAll.selectPage();
  };
  const handleSelectNone = () => {
    setSelectAllDropdownOpen(false);
    selectAll.selectNone();
  };

  useEffect(() => {
    let newCheckedState;
    if (selectAll.selectedCount() === 0) {
      newCheckedState = false;
    } else if (selectAll.selectedCount() > 0) {
      newCheckedState = null; // null is partially-checked state
    } else if (selectAll.areAllRowsSelected()) {
      newCheckedState = true;
    }
    setSelectAllChecked(newCheckedState);
  }, [selectAll.selectedCount(), selectAll.areAllRowsSelected()]);

  // TODO: add the following to selectAllDropdownItems when Select All is implemented
  // <DropdownItem key="select-all" component="button" isDisabled onClick={handleSelectAll}>
  //   {`${__('Select all')} (${totalCount})`}
  // </DropdownItem>,

  const selectAllDropdownItems = [
    <DropdownItem key="select-none" component="button" onClick={handleSelectNone}>
      {`${__('Select none')} (0)`}
    </DropdownItem>,
    <DropdownItem key="select-page" component="button" isDisabled={selectAll.areAllRowsOnPageSelected()} onClick={handleSelectPage}>
      {`${__('Select page')} (${pageRowCount})`}
    </DropdownItem>,
  ];

  return (
    <Dropdown
      toggle={
        <DropdownToggle
          onToggle={onSelectAllDropdownToggle}
          id="toggle-id-8"
          splitButtonItems={[
            <DropdownToggleCheckbox
              className="tablewrapper-select-all-checkbox"
              key="tablewrapper-select-all-checkbox"
              aria-label="Select all"
              onChange={checked => onSelectAllCheckboxChange(checked)}
              isChecked={isSelectAllChecked}
            >
              {selectAll.selectedCount() > 0 && `${selectAll.selectedCount()} selected`}
            </DropdownToggleCheckbox>,
          ]}
        />
    }
      isOpen={isSelectAllDropdownOpen}
      dropdownItems={selectAllDropdownItems}
    />
  );
};

// TODO: uncomment selectAll and totalCount when Select All is implemented
SelectAllCheckbox.propTypes = {
  selectAll: PropTypes.instanceOf(SelectAllManager).isRequired,
  pageRowCount: PropTypes.number,
};

export default SelectAllCheckbox;
