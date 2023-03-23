import { makeAutoObservable } from 'mobx';

import { LineRange } from './line-range';

export class LineRanges {
  ranges: LineRange[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  addRange(start: number, end: number) {
    this.ranges.push(new LineRange(start, end));
  }

  removeRange(start: number, end: number) {
    const range = new LineRange(start, end);
    this.ranges = this.ranges.filter((r) => r.equalsTo(range) === false);
  }

  isInRange(lineNumber: number) {
    return this.ranges.some((range) => range.isInRange(lineNumber));
  }

  get filter() {
    return (lineNumber: number) => this.isInRange(lineNumber);
  }
}
