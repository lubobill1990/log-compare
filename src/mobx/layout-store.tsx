/* eslint-disable max-classes-per-file */
import { makeAutoObservable } from 'mobx';
import { createContext, useContext } from 'react';

import { AutoRunManager } from './autorun-manager';
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

  slots = new SlotStore();

  activityBarEntrySlots = new SlotStore();

  sideBarSlotGenerators = new SlotGeneratorStore();

  selectedActivityEntryId = '';

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

  getSlot(slot: SlotName) {
    return this.slots.get(slot);
  }

  toggleActivityEntry(id: string) {
    if (this.selectedActivityEntryId === id) {
      this.selectedActivityEntryId = '';
    } else {
      this.selectedActivityEntryId = id;
    }
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
