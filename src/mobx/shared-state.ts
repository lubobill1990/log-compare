/* eslint-disable max-classes-per-file */
import { makeAutoObservable } from 'mobx';
import { v4 as uuidv4 } from 'uuid';

import { Filter } from './filter';
import { LogFiles, logFileStore } from './log-file';

export class SharedStateStore {
  globalFilter = new Filter();

  focusTimestamp: number = 0;

  id = uuidv4();

  updatedBy?: string = undefined;

  constructor(private logFiles: LogFiles) {
    makeAutoObservable(this);
  }

  setFocusTimestamp(timestamp: number) {
    this.focusTimestamp = timestamp;
    this.logFiles.selectTimestamp(timestamp);
  }
}

export const sharedStateStore = new SharedStateStore(logFileStore);

export function useSharedStateStore() {
  return sharedStateStore;
}
