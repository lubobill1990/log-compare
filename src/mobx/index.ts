/* eslint-disable max-classes-per-file */
import { makeAutoObservable } from 'mobx';
import { v4 as uuidv4 } from 'uuid';

import { Filter } from './filter';

export class SharedState {
  globalFilter = new Filter();

  focusTimestamp: number = 0;

  id = uuidv4();

  updatedBy?: string = undefined;

  constructor() {
    makeAutoObservable(this);
  }
}
