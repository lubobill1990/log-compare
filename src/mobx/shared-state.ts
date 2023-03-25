/* eslint-disable max-classes-per-file */
import { action, makeAutoObservable } from 'mobx';
import { v4 as uuidv4 } from 'uuid';

import { PostedData, SharedState } from '@/worker/shared-worker';

import { AutoRunManager } from './autorun-manager';
import { Filter, globalFilterStore } from './filter';

const sharedWorker = new SharedWorker(
  new URL('../worker/shared-worker.ts', import.meta.url)
);

export class SharedStateStore implements SharedState {
  searchKeywords: string = '';

  highlightText: string = '';

  focusTimestamp: number = Number.MAX_SAFE_INTEGER;

  id = uuidv4();

  updatedBy?: string = undefined;

  private autoRunManager = new AutoRunManager();

  constructor(private globalFilter: Filter) {
    makeAutoObservable(this, {
      searchKeywords: false,
      highlightText: false,
    });
  }

  init() {
    sharedWorker.port.addEventListener(
      'message',
      action((event: any) => {
        const { type, payload } = event.data as PostedData;
        if (type === 'send') {
          if (payload.focusTimestamp) {
            this.setFocusTimestamp(payload.focusTimestamp, false);
          }
          if (payload.highlightText) {
            this.setHighlightText(payload.highlightText);
          }
          if (payload.searchKeywords) {
            this.setSearchKeywords(payload.searchKeywords);
          }
        }
      })
    );
    sharedWorker.port.start();
    sharedWorker.port.postMessage({
      type: 'fetch',
    });
    this.autoRunManager.autorun(() => {
      let needBroadcast = false;
      if (this.highlightText !== this.globalFilter.highlightText) {
        this.highlightText = this.globalFilter.highlightText;
        needBroadcast = true;
      }
      if (this.searchKeywords !== this.globalFilter.searchKeywords) {
        this.searchKeywords = this.globalFilter.searchKeywords;
        needBroadcast = true;
      }
      if (needBroadcast) {
        this.broadcast();
      }
    });
  }

  dispose() {
    sharedWorker.port.close();
    this.autoRunManager.dispose();
  }

  broadcast() {
    sharedWorker.port.postMessage({
      type: 'send',
      payload: {
        focusTimestamp: this.focusTimestamp,
        highlightText: this.globalFilter.highlightText,
        searchKeywords: this.searchKeywords,
      },
    });
  }

  setFocusTimestamp(timestamp: number, broadcast = true) {
    if (this.focusTimestamp === timestamp) {
      return;
    }
    this.focusTimestamp = timestamp;
    if (broadcast) {
      this.broadcast();
    }
  }

  setHighlightText(text: string) {
    if (this.highlightText === text) {
      return;
    }

    this.globalFilter.setHighlightText(text);
    this.highlightText = text;
  }

  setSearchKeywords(keywords: string) {
    if (this.searchKeywords === keywords) {
      return;
    }

    this.globalFilter.setSearchKeywords(keywords);
    this.searchKeywords = keywords;
  }
}

export const sharedStateStore = new SharedStateStore(globalFilterStore);
sharedStateStore.init();
export function useSharedStateStore() {
  return sharedStateStore;
}
