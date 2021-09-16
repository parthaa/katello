import { useState, useRef } from 'react';

export class SelectAllManager {
  constructor(results, metadata, selectionSet) {
    this.results = results;
    this.metadata = metadata;
    this.selectionSet = selectionSet;
  }

  resultIds = () =>
     this.results?.map(result => result.id) ?? [];

  areAllRowsOnPageSelected = () => {
    const ids = this.resultIds();
    return Number(ids?.length) > 0 && ids.every(result => this.selectionSet.has(result));
  }

  areAllRowsSelected = () =>
     Number(this.selectionSet.size) > 0 && this.selectionSet.size === Number(this.metadata.total);


  selectPage = () =>
    this.resultIds().forEach(id => this.selectionSet.add(id));

  selectNone = () =>
    this.selectionSet.clear();

  onRowSelect = (isSelected, id) => {
    if (isSelected) {
      this.selectionSet.add(id);
    } else {
      this.selectionSet.delete(id);
    }
  };
  clear = () => this.selectionSet.clear()
  selectedCount = () => this.selectionSet.size
  isSelected = (id) => this.selectionSet.has(id)
}

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
}

export const useSet = (initialArry) => {
  const [, setToggle] = useState(false);
  // needed because mutating a Ref won't cause React to rerender
  const forceRender = () => setToggle(prev => !prev);
  const set = useRef(new ReactConnectedSet(initialArry, forceRender));
  return set.current;
};
