/* eslint-disable max-classes-per-file */
import { makeAutoObservable } from 'mobx';
import { createContext, useContext } from 'react';

import { AutoRunManager } from './autorun-manager';
import { SideBarSectionStore } from './side-bar-section-store';
import { SlotGeneratorStore } from './slot-generator-store';
import { SlotStore } from './slot-store';

export enum SlotName {
  sideBar = 'sideBar',
  activityBar = 'activityBar',
  mainView = 'mainView',
  searchBar = 'searchBar',
  logPanel = 'logPanel',
}

export class LayoutStore {
  isSideBarVisible = false;

  layoutSlots = new SlotStore();

  activityBarEntrySlots = new SlotStore();

  sideBarSlotGenerators = new SlotGeneratorStore();

  selectedActivityEntryId = '';

  sideBarSections = new SideBarSectionStore();

  autoRunManager = new AutoRunManager();

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  init() {}

  destroy() {
    this.autoRunManager.dispose();
  }

  setIsSideBarVisible(val: boolean) {
    this.isSideBarVisible = val;
  }

  getLayoutSlot(slot: SlotName) {
    return this.layoutSlots.get(slot);
  }

  toggleActivityEntry(id: string) {
    if (this.selectedActivityEntryId === id) {
      this.selectedActivityEntryId = '';
    } else {
      this.selectedActivityEntryId = id;
    }
  }

  showActivityEntry(id: string) {
    this.selectedActivityEntryId = id;
  }

  get activityBarEntries() {
    return this.activityBarEntrySlots.slotArray;
  }
}

export const layoutStore = new LayoutStore();
layoutStore.init();
const context = createContext(layoutStore);

export function useLayoutStore() {
  return useContext(context);
}
