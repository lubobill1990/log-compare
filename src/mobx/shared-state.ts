/* eslint-disable max-classes-per-file */
import { action, autorun, makeAutoObservable } from 'mobx';
import { v4 as uuidv4 } from 'uuid';

import { PostedData, SharedState } from '@/worker/shared-worker';

import { Filter, globalFilterStore } from './filter';
import { LogFiles, logFileStore } from './log-file';

const sharedWorker = new SharedWorker(
  new URL('../worker/shared-worker.ts', import.meta.url)
);

export class SharedStateStore implements SharedState {
  searchKeywords: string = '';

  highlightText: string = '';

  focusTimestamp: number = 0;

  id = uuidv4();

  updatedBy?: string = undefined;

  constructor(private logFiles: LogFiles, private globalFilter: Filter) {
    makeAutoObservable(this, {
      searchKeywords: false,
      highlightText: false,
      focusTimestamp: false,
    });

    sharedWorker.port.addEventListener(
      'message',
      action((event: any) => {
        const { type, payload } = event.data as PostedData;
        if (type === 'send') {
          if (payload.focusTimestamp) {
            this.setFocusTimestamp(payload.focusTimestamp);
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
    autorun(() => {
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

  setFocusTimestamp(timestamp: number) {
    if (this.focusTimestamp !== timestamp) {
      return;
    }
    this.focusTimestamp = timestamp;
    this.logFiles.selectTimestamp(timestamp);
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

export const sharedStateStore = new SharedStateStore(
  logFileStore,
  globalFilterStore
);

export function useSharedStateStore() {
  return sharedStateStore;
}
