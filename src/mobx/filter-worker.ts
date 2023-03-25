import { throttle } from 'lodash';
import { makeAutoObservable, toJS } from 'mobx';

import { LogLine } from '@/interface';
import { binarySearchClosestLog } from '@/util';

import { AutoRunManager } from './autorun-manager';
import { ContentFilter } from './content-filter';
import { LineRanges } from './line-ranges';
import { getLinesFromContent } from './log-file-utils';

/// <reference lib="webworker" />

type SelectedNumberArray = [number, number, number];

type SyncOutCallbacks = {
  filterStart: () => void;
  filterEnd: (lineCount: number) => void;
  selectedLineChanged: (
    selectedLines: SelectedNumberArray,
    selectedTimestamps: SelectedNumberArray
  ) => void;
  filteredLineIndexOfSelectedTimestampChanged: (val: number) => void;
};

class LogFileWorker {
  lines: LogLine[] = [];

  expandedLineRanges: LineRanges = new LineRanges();

  pinedLines = new Map<number, boolean>();

  selectedLines: SelectedNumberArray = [0, 0, 0];

  selectedTimestamps: SelectedNumberArray = [
    Number.MAX_SAFE_INTEGER,
    Number.MAX_SAFE_INTEGER,
    Number.MAX_SAFE_INTEGER,
  ];

  private autoRunManager = new AutoRunManager();

  constructor(
    private contentFilter: ContentFilter,
    public content: string,
    private syncOutCallbacks: SyncOutCallbacks,
    pinedLinesArray: number[] = []
  ) {
    this.pinedLines = new Map(
      pinedLinesArray.map((lineNumber) => [lineNumber, true])
    );
    this.lines = getLinesFromContent(content);
    makeAutoObservable(this, {
      pinedLines: false,
    });
  }

  init() {
    this.autoRunManager.autorun(() => {
      this.syncOutCallbacks.selectedLineChanged(
        toJS(this.selectedLines),
        toJS(this.selectedTimestamps)
      );
    });
    this.autoRunManager.autorun(() => {
      this.syncOutCallbacks.filteredLineIndexOfSelectedTimestampChanged(
        toJS(this.filteredLineIndexOfSelectedTimestamp)
      );
    });
    this.autoRunManager.autorun(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { filteredLines } = this;
    });
  }

  dispose() {
    this.autoRunManager.dispose();
  }

  get filteredLines() {
    const { lineFilter } = this.contentFilter;
    const rangeFilter = this.expandedLineRanges.filter;
    this.syncOutCallbacks.filterStart();
    const res = this.lines.filter((line) => {
      return (
        rangeFilter(line.lineNumber) ||
        this.pinedLines.has(line.lineNumber) ||
        lineFilter(line.content)
      );
    });
    this.syncOutCallbacks.filterEnd(this.lines.length);
    return res;
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
let worker = new LogFileWorker(contentFilter, '', {
  filterStart: () => {},
  filterEnd: () => {},
  selectedLineChanged: () => {},
  filteredLineIndexOfSelectedTimestampChanged: () => {},
});
export function setupLogFileWorker(
  content: string,
  pinedLines: number[],
  filterStart: () => void,
  filterEnd: (lineCount: number) => void,
  selectedLineChanged: (
    selectedLines: SelectedNumberArray,
    selectedTimestamps: SelectedNumberArray
  ) => void,
  filteredLineIndexOfSelectedTimestampChanged: (val: number) => void
) {
  worker = new LogFileWorker(
    contentFilter,
    content,
    {
      filterStart,
      filterEnd,
      selectedLineChanged,
      filteredLineIndexOfSelectedTimestampChanged,
    },
    pinedLines
  );
  worker.init();
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

export function terminate() {
  // eslint-disable-next-line no-restricted-globals
  self.close();
}
