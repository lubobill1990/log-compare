import { makeAutoObservable } from 'mobx';

import { LineRange } from './line-range';

export class LineRanges {
  ranges: LineRange[] = [];

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  addRange(start: number, end: number) {
    this.ranges.push(new LineRange(start, end));
  }

  removeRange(start: number, end: number) {
    const range = new LineRange(start, end);
    this.ranges = this.ranges.filter((r) => r.equalsTo(range) === false);
  }

  get isInRange() {
    const { ranges } = this;
    return (lineNumber: number) => {
      return ranges.some((range) => range.isInRange(lineNumber));
    };
  }

  get filter() {
    const { isInRange } = this;
    console.log('isInRange changed');
    return (lineNumber: number) => isInRange(lineNumber);
  }
}
