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

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
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
}

const uiStore = new UIStore();
const context = createContext(uiStore);

export function useUIStore() {
  return useContext(context);
}
