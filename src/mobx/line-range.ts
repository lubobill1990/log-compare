import { makeAutoObservable } from 'mobx';

export class LineRange {
  constructor(public start: number, public end: number) {
    makeAutoObservable(this);
  }

  isInRange(lineNumber: number) {
    return lineNumber >= this.start && lineNumber <= this.end;
  }

  equalsTo(other: LineRange) {
    return this.start === other.start && this.end === other.end;
  }
}
