import { useState, useRef } from 'react';
import { isEmpty } from 'lodash';

class ReactConnectedSet extends Set {
  constructor(initialValue, forceRender) {
    super();
    this.forceRender = forceRender;
    // The constructor would normally call add() with the initial value, but since we
    // must call super() at the top, this.forceRender() isn't defined yet.
    // So, we call super() above with no argument, then call add() manually below
    // after forceRender is defined.
    if (initialValue) {
      if (initialValue.constructor.name === 'Array') {
        initialValue.forEach(val => this.add(val));
      } else {
        this.add(initialValue);
      }
    }
  }
  add(value) {
    const result = super.add(value); // ensuring these methods have the same API as the superclass
    this.forceRender();
    return result;
  }

  clear() {
    const result = super.clear();
    this.forceRender();
    return result;
  }

  delete(value) {
    const result = super.delete(value);
    this.forceRender();
    return result;
  }

  onToggle(isOpen, id) {
    if (isOpen) {
      this.add(id);
    } else {
      this.delete(id);
    }
  }

  addAll(ids) {
    ids.forEach(id => super.add(id));
    this.forceRender();
  }
}

export const useSet = (initialArry) => {
  const [, setToggle] = useState(0);
  // needed because mutating a Ref won't cause React to rerender
  const forceRender = () => setToggle(prev => prev + 1);
  const set = useRef(new ReactConnectedSet(initialArry, forceRender));
  return set.current;
};

export const useSelectionSet = (results, metadata, initialArry = [], idColumn = 'id') => {
  const selectionSet = useSet(initialArry);
  const ids = results?.map(result => result[idColumn]) ?? [];
  const areAllRowsOnPageSelected = () => Number(ids?.length) > 0 &&
                                         ids.every(result => selectionSet.has(result));

  const selectPage = () => selectionSet.addAll(ids);
  const selectNone = () => selectionSet.clear();
  const onRowSelect = (isSelected, id) => {
    if (isSelected) {
      selectionSet.add(id);
    } else {
      selectionSet.delete(id);
    }
  };

  const selectedCount = selectionSet.size;

  const isSelected = id => selectionSet.has(id);

  return {
    onRowSelect,
    selectedCount,
    areAllRowsOnPageSelected,
    selectPage,
    selectNone,
    isSelected,
    selectionSet,
  };
};

export const useBulkSelect = (results, metadata, initialArry = [], idColumn = 'id') => {
  const { selectionSet: inclusionSet, ...selectOptions } =
                useSelectionSet(results, metadata, initialArry, idColumn);
  const exclusionSet = useSet([]);
  const [searchQuery, updateSearchQuery] = useState('');
  const [isSelectAllChecked, setSelectAll] = useState(false);
  const selectedCount = isSelectAllChecked ?
    Number(metadata.subtotal) - exclusionSet.size : selectOptions.selectedCount;

  const areAllRowsOnPageSelected = () => isSelectAllChecked ||
                                         selectOptions.areAllRowsOnPageSelected();

  const isSelected = (id) => {
    if (isSelectAllChecked) {
      return !exclusionSet.has(id);
    }
    return inclusionSet.has(id);
  };

  const selectPage = () => {
    setSelectAll(false);
    selectOptions.selectPage();
  };

  const selectNone = () => {
    setSelectAll(false);
    selectOptions.selectNone();
  };

  const onRowSelect = (isRowSelected, id) => {
    if (isSelectAllChecked) {
      if (isRowSelected) {
        exclusionSet.delete(id);
      } else {
        exclusionSet.add(id);
      }
    } else {
      selectOptions.onRowSelect(isRowSelected, id);
    }
  };

  const fetchBulkIds = () => {
    const selected = {
      included: {
        ids: [],
        search: null,
      },
      excluded: {
        ids: [],
      },
    };

    if (isSelectAllChecked) {
      selected.included.search = searchQuery;
      selected.excluded.ids = [...exclusionSet];
    } else if (!isEmpty(inclusionSet)) {
      selected.included.ids = [...inclusionSet];
    } else {
      return {};
    }
    return selected;
  };

  const setSelectAllChecked = (checked) => {
    if (checked) {
      exclusionSet.clear();
    } else {
      inclusionSet.clear();
    }
    setSelectAll(checked);
  };

  const clearSelections = () => {
    setSelectAll(false);
    inclusionSet.clear();
    exclusionSet.clear();
  };

  return {
    ...selectOptions,
    selectPage,
    selectNone,
    isSelected,
    selectedCount,
    isSelectAllChecked,
    setSelectAllChecked,
    fetchBulkIds,
    searchQuery,
    updateSearchQuery,
    onRowSelect,
    areAllRowsOnPageSelected,
    clearSelections,
  };
};
