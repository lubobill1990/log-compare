import { makeAutoObservable } from 'mobx';
import { createContext, useContext } from 'react';

type AnchorPoint = { x: number; y: number };

export enum ContextMenuKey {
  LogFileHeader = 'LogFileHeader',
  LogLine = 'LogLine',
}

export class UIStore {
  contextMenuAnchorPoint: AnchorPoint = { x: 0, y: 0 };

  contextMenuActiveKey: ContextMenuKey | null = null;

  contextMenuData: any | null = null;

  isLoadFilterModalVisible = false;

  isSaveFilterModalVisible = false;

  logPanelWidth = 0;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  toggleLoadFilterModal() {
    this.isLoadFilterModalVisible = !this.isLoadFilterModalVisible;
  }

  toggleSaveFilterModel() {
    this.isSaveFilterModalVisible = !this.isSaveFilterModalVisible;
  }

  showContextMenu(
    anchorPoint: AnchorPoint,
    activeKey: ContextMenuKey,
    data?: any
  ) {
    this.contextMenuAnchorPoint = anchorPoint;
    this.contextMenuActiveKey = activeKey;
    this.contextMenuData = data ?? null;
  }

  hideContextMenu() {
    this.contextMenuActiveKey = null;
    this.contextMenuData = null;
  }

  setLogPanelWidth(width: number) {
    this.logPanelWidth = width;
  }
}

const uiStore = new UIStore();
const context = createContext(uiStore);

export function useUIStore() {
  return useContext(context);
}
