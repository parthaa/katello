import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Dropdown, DropdownToggle, DropdownToggleCheckbox,
  DropdownItem } from '@patternfly/react-core';
import { translate as __ } from 'foremanReact/common/I18n';
import { noop } from 'foremanReact/common/helpers';

import './SelectAllCheckbox.scss';

const SelectAllCheckbox = ({
  // selectAll,
  selectNone,
  selectPage,
  selectedCount,
  pageRowCount,
  totalCount,
  areAllRowsOnPageSelected,
  setSelectAllChecked,
  isSelectAllChecked,
}) => {
  const [isSelectAllDropdownOpen, setSelectAllDropdownOpen] = useState(false);
  const [selectionState, setSelectionState] = useState('none');
  const [selectionToggle, setSelectionToggle] = useState(false);

  const onSelectAllCheckboxChange = (checked) => {
    setSelectionToggle(checked);
    if (checked) {
      if (selectionState === 'page') {
        return selectPage();
      }
      return setSelectAllChecked(true);
    }
    return selectNone();
  };
  const onSelectAllDropdownToggle = () => setSelectAllDropdownOpen(isOpen => !isOpen);

  const handleSelectAll = () => {
    setSelectAllDropdownOpen(false);
    setSelectionToggle(true);
    setSelectAllChecked(true);
  };
  const handleSelectPage = () => {
    setSelectAllDropdownOpen(false);
    setSelectionToggle(true);
    selectPage();
  };
  const handleSelectNone = () => {
    setSelectAllDropdownOpen(false);
    setSelectionToggle(false);
    selectNone();
  };

  const onSelect = (event) => {
    const { id } = event.currentTarget;
    if (id) {
      setSelectionState(id);
    }
  };

  useEffect(() => {
    let checkedState = null;
    if (selectedCount === 0) {
      checkedState = false;
    } else if (selectedCount !== totalCount) {
      if (selectionState === 'page' && areAllRowsOnPageSelected) {
        checkedState = true;
      }
    } else {
      checkedState = true;
    }

    setSelectionToggle(checkedState);
  }, [selectedCount, totalCount, selectionState, areAllRowsOnPageSelected]);


  const selectAllDropdownItems = [
    <DropdownItem key="select-none" id="none" component="button" onClick={handleSelectNone} >
      {`${__('Select none')} (0)`}
    </DropdownItem>,
    <DropdownItem key="select-page" id="page" component="button" isDisabled={areAllRowsOnPageSelected} onClick={handleSelectPage}>
      {`${__('Select page')} (${pageRowCount})`}
    </DropdownItem>,
  ];
  if (isSelectAllChecked !== null) {
    const selectAll = (
      <DropdownItem key="select-all" id="all" component="button" isDisabled={isSelectAllChecked} onClick={handleSelectAll}>
        {`${__('Select all')} (${totalCount})`}
      </DropdownItem>
    );
    selectAllDropdownItems.push(selectAll);
  }

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
              isChecked={selectionToggle}
            >
              {selectedCount > 0 && `${selectedCount} selected`}
            </DropdownToggleCheckbox>,
          ]}
        />
      }
      onSelect={onSelect}
      isOpen={isSelectAllDropdownOpen}
      dropdownItems={selectAllDropdownItems}
      id="selection-checkbox"
    />
  );
};

SelectAllCheckbox.propTypes = {
  selectedCount: PropTypes.number.isRequired,
  selectNone: PropTypes.func.isRequired,
  selectPage: PropTypes.func.isRequired,
  setSelectAllChecked: PropTypes.func,
  pageRowCount: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  isSelectAllChecked: PropTypes.bool,
  areAllRowsOnPageSelected: PropTypes.bool.isRequired,
};

SelectAllCheckbox.defaultProps = {
  isSelectAllChecked: null,
  setSelectAllChecked: noop,
};

export default SelectAllCheckbox;
