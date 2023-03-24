import { throttle } from 'lodash';
import { autorun, makeAutoObservable, toJS } from 'mobx';

import { LogLine } from '@/interface';
import { binarySearchClosestLog } from '@/util';

import { ContentFilter } from './content-filter';
import { LineRanges } from './line-ranges';
import { getLinesFromContent } from './log-file-utils';

/// <reference lib="webworker" />

type SelectedNumberArray = [number, number, number];

class LogFileWorker {
  lines: LogLine[] = [];

  expandedLineRanges: LineRanges = new LineRanges();

  pinedLines = new Map<number, boolean>();

  selectedLines: SelectedNumberArray = [0, 0, 0];

  selectedTimestamps: SelectedNumberArray = [0, 0, 0];

  constructor(
    private contentFilter: ContentFilter,
    public content: string,
    pinedLinesArray: number[] = []
  ) {
    this.pinedLines = new Map(
      pinedLinesArray.map((lineNumber) => [lineNumber, true])
    );
    this.lines = getLinesFromContent(content);
    makeAutoObservable(this);
  }

  get filteredLines() {
    const { lineFilter } = this.contentFilter;
    const rangeFilter = this.expandedLineRanges.filter;

    return this.lines.filter((line) => {
      return (
        rangeFilter(line.lineNumber) ||
        this.pinedLines.has(line.lineNumber) ||
        lineFilter(line.content)
      );
    });
  }

  selectLine(lineNumber: number) {
    if (
      lineNumber < this.lines.length &&
      lineNumber >= 0 &&
      this.selectedLines[0] !== lineNumber
    ) {
      this.selectedLines.unshift(lineNumber);
      this.selectedLines.pop();
      this.selectTimestamp(this.lines[lineNumber].timestamp);
    }
  }

  selectTimestamp(timestamp: number) {
    if (this.selectedTimestamps[0] !== timestamp) {
      this.selectedTimestamps.unshift(timestamp);
      this.selectedTimestamps.pop();
    }
  }

  selectNearestTimestamp(targetTimestamp: number) {
    const lineIndex = this.getClosestLineIndexFromTimestmap(targetTimestamp);
    const nearestTimestamp = this.filteredLines[lineIndex]?.timestamp;
    if (nearestTimestamp) {
      this.selectTimestamp(nearestTimestamp);
    }
  }

  get selectedLineNumber() {
    return this.selectedLines[0];
  }

  get selectedTimestamp() {
    return this.selectedTimestamps[0];
  }

  get filteredLineIndexOfSelectedTimestamp() {
    return this.getClosestLineIndexFromTimestmap(this.selectedTimestamp);
  }

  getClosestLineIndexFromTimestmap(targetTimestamp: number) {
    return binarySearchClosestLog(this.filteredLines, targetTimestamp, true);
  }
}

const contentFilter = new ContentFilter();
let worker = new LogFileWorker(contentFilter, '');
export function setupLogFileWorker(
  content: string,
  pinedLines: number[],
  linesFiltered: (logLines: LogLine[]) => void,
  selectedLineChanged: (
    selectedLines: SelectedNumberArray,
    selectedTimestamps: SelectedNumberArray
  ) => void,
  filteredLineIndexOfSelectedTimestampChanged: (val: number) => void,
  filteredLineLengthChanged: (val: number) => void
) {
  worker = new LogFileWorker(contentFilter, content, pinedLines);
  autorun(() => {
    filteredLineLengthChanged(worker.filteredLines.length);
  });
  autorun(() => {
    selectedLineChanged(
      toJS(worker.selectedLines),
      toJS(worker.selectedTimestamps)
    );
  });
  autorun(() => {
    filteredLineIndexOfSelectedTimestampChanged(
      toJS(worker.filteredLineIndexOfSelectedTimestamp)
    );
  });
}

export function setFilterStrings(filterStrings: string[]) {
  contentFilter.setFilterStrings(filterStrings);
}

export function addExpandedLineRange(start: number, end: number) {
  worker.expandedLineRanges.addRange(start, end);
}

export function setPinedLine(lineNumber: number, pined: boolean) {
  if (pined) {
    worker.pinedLines.set(lineNumber, true);
  } else {
    worker.pinedLines.delete(lineNumber);
  }
}

export const selectLine = throttle((lineNumber: number) => {
  worker.selectLine(lineNumber);
}, 50);

export const selectTimestamp = throttle((lineNumber: number) => {
  worker.selectTimestamp(lineNumber);
}, 50);

export const selectNearestTimestamp = throttle((targetTimestamp: number) => {
  worker.selectNearestTimestamp(targetTimestamp);
}, 50);

export function fetchFilteredLine(indexArrayToFetch: number[]) {
  return indexArrayToFetch.reduce((accu, i) => {
    // eslint-disable-next-line no-param-reassign
    accu[i] = toJS(worker.filteredLines[i]);
    return accu;
  }, {} as Record<number, LogLine>);
}
