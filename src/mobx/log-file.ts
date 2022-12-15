/* eslint-disable max-classes-per-file */
import { makeAutoObservable } from 'mobx';
import { createContext, useContext } from 'react';
import getSha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';

import { LogLine } from '@/interface';
import { StorageProvider } from '@/utils/storage-provider';

import { Filter } from './filter';

class LineRange {
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

class LineRanges {
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
    return (line: LogLine) => this.isInRange(line.lineNumber);
  }
}

class LogFileStorageProvider extends StorageProvider {
  loadPinedLines() {
    return new Map(
      this.load<number[]>([], `pinLines`).map((lineNumber) => [
        lineNumber,
        true,
      ])
    );
  }

  savePinedLines(pinedLines: Map<number, boolean>) {
    this.save(Array.from(pinedLines.keys()), `pinLines`);
  }
}

function getDateFromLine(
  line: string,
  previousDate: Date,
  startFromIndex: number = 57
) {
  if (line.search(/^\s/) === 0) {
    return { dateString: '', date: previousDate };
  }

  for (
    let i = startFromIndex === 0 ? 57 : Math.min(startFromIndex, line.length);
    i > 23;
    i -= 1
  ) {
    const dateString = line.substring(0, i);
    const date = new Date(dateString);
    if (date.toString() !== 'Invalid Date') {
      return { dateString, date };
    }
  }
  return { dateString: '', date: previousDate };
}

const minimumValidTimestamp = new Date('2020-01-01').getTime();
const maximumValidTimestamp = new Date().getTime();

function isValidTimestamp(timestamp: number) {
  return timestamp > minimumValidTimestamp && timestamp < maximumValidTimestamp;
}

export class LogFileNameStore {
  private storageProvider: StorageProvider;

  constructor() {
    this.storageProvider = new StorageProvider('logFilenameMapping');
  }

  private getFileNameMapping() {
    return this.storageProvider.load<Record<string, string>>({});
  }

  getFileName(sha1: string) {
    return this.getFileNameMapping()[sha1];
  }

  setFileName(sha1: string, fileName: string) {
    const mapping = this.getFileNameMapping();
    mapping[sha1] = fileName;
    this.storageProvider.save(mapping);
  }
}

export class LogFile {
  lines: LogLine[] = [];

  id = uuidv4();

  filter = new Filter();

  selectedLines = [0, 0, 0];

  selectedTimestamps = [0, 0, 0];

  expandedLineRanges: LineRanges = new LineRanges();

  pinedLines = new Map<number, boolean>();

  private storageProvider: LogFileStorageProvider;

  constructor(
    private logFileNameStore: LogFileNameStore,
    private logFiles: LogFiles,
    public globalFilter: Filter,
    public originName: string,
    public content: string,
    public sha1 = getSha1(content) as string,
    public customizedName = logFileNameStore.getFileName(sha1)
  ) {
    this.selectedTimestamps[0] = Date.now();
    this.lines = this.getLinesFromContent(content);
    this.storageProvider = new LogFileStorageProvider(`logFile-${this.sha1}`);
    this.pinedLines = this.storageProvider.loadPinedLines();
    makeAutoObservable(this, {
      lines: false,
    });
  }

  private getLinesFromContent(content: string) {
    const rawLines = content.split('\n');
    let previousDate = new Date();
    let previousDateString = '';
    let orderDiffSum = 0;
    const logLines = rawLines.map((line, index) => {
      const { date, dateString } = getDateFromLine(
        line,
        previousDate,
        previousDateString.length
      );
      const timestamp = date.getTime();

      if (dateString.length > 0 && isValidTimestamp(timestamp)) {
        const timeDiff = timestamp - previousDate.getTime();
        if (timeDiff > 0) {
          orderDiffSum += 1;
        } else if (timeDiff < 0) {
          orderDiffSum -= 1;
        }
      }
      previousDate = date;
      previousDateString = dateString;

      const thisLine: string = `${date
        .getHours()
        .toString()
        .padStart(2, '0')}:${date
        .getMinutes()
        .toString()
        .padStart(2, '0')}:${date
        .getSeconds()
        .toString()
        .padStart(2, '0')}.${date
        .getMilliseconds()
        .toString()
        .padStart(3, '0')} - ${line.slice(dateString.length)}`;
      return new LogLine(timestamp, thisLine, index);
    });

    return orderDiffSum > 0
      ? logLines.reverse().map((logLine) => ({
          ...logLine,
          lineNumber: logLines.length - logLine.lineNumber - 1,
        }))
      : logLines;
  }

  get highlightKeywords() {
    return [this.filter.highlightText, this.globalFilter.highlightText]
      .join(',')
      .split(',')
      .map((v) => v.trim())
      .filter((v) => !!v);
  }

  highlightContent(content: string) {
    return this.highlightKeywords.reduce((acc, keyword, currentIndex) => {
      const colorIndex = (currentIndex % 18) + 1;
      return acc.replaceAll(
        keyword,
        `<b class="c${colorIndex}">${keyword}</b>`
      );
    }, content);
  }

  delete() {
    this.logFiles.delete(this);
  }

  focus() {
    this.logFiles.focus(this);
  }

  unfocus() {
    this.logFiles.unfocus(this);
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

  selectNearestTimestamp(timestamp: number) {
    const lineNumber = this.getClosestLineIndexFromTimestmap(timestamp);
    const nearestTimestamp = this.lines[lineNumber]?.timestamp;
    if (nearestTimestamp) {
      this.selectTimestamp(nearestTimestamp);
    }
  }

  pinLine(lineNumber: number) {
    this.pinedLines.set(lineNumber, true);
    this.storageProvider.savePinedLines(this.pinedLines);
  }

  unpinLine(lineNumber: number) {
    this.pinedLines.delete(lineNumber);
    this.storageProvider.savePinedLines(this.pinedLines);
  }

  get isFocused() {
    return this.logFiles.focusedFile?.id === this.id;
  }

  get name() {
    return this.customizedName || this.originName;
  }

  set name(name: string) {
    this.customizedName = name;
    this.logFileNameStore.setFileName(this.sha1, name);
  }

  get filteredLines() {
    const localKeywordFilter = this.filter.keywordFilter;
    const globalKeywordFilter = this.globalFilter.keywordFilter;
    const rangeFilter = this.expandedLineRanges.filter;
    return this.lines.filter((line) => {
      return (
        (localKeywordFilter(line) && globalKeywordFilter(line)) ||
        this.pinedLines.has(line.lineNumber) ||
        rangeFilter(line)
      );
    });
  }

  get selectedLineNumber() {
    return this.selectedLines[0];
  }

  get selectedTimestamp() {
    return this.selectedTimestamps[0];
  }

  get filteredLineNumberOfSelectedTimestamp() {
    return this.getClosestLineIndexFromTimestmap(this.selectedTimestamp);
  }

  get searchKeywordsArray() {
    return [
      this.filter.searchKeywords,
      this.globalFilter.searchKeywords,
    ].filter((v) => v);
  }

  getClosestLineFromTimestamp(targetTimestamp: number, isInvertedOrder = true) {
    const index = this.getClosestLineIndexFromTimestmap(
      targetTimestamp,
      isInvertedOrder
    );
    return this.filteredLines[index];
  }

  getClosestLineIndexFromTimestmap(
    targetTimestamp: number,
    isInvertedOrder: boolean = true
  ) {
    const orderedLogLines = this.filteredLines;
    let start = 0;
    let end = orderedLogLines.length - 1;

    if (isInvertedOrder) {
      while (start <= end) {
        const middleIndex = Math.floor((start + end) / 2);
        const middleTimestamp = orderedLogLines[middleIndex].timestamp;
        if (middleTimestamp === targetTimestamp) {
          // found the key
          return middleIndex;
        }
        if (middleTimestamp < targetTimestamp) {
          // continue searching to the right
          end = middleIndex - 1;
        } else {
          // search searching to the left
          start = middleIndex + 1;
        }
      }
    } else {
      while (start <= end) {
        const middleIndex = Math.floor((start + end) / 2);
        const middleTimestamp = orderedLogLines[middleIndex].timestamp;
        if (middleTimestamp === targetTimestamp) {
          // found the key
          return middleIndex;
        }
        if (middleTimestamp < targetTimestamp) {
          // continue searching to the right
          start = middleIndex + 1;
        } else {
          // search searching to the left
          end = middleIndex - 1;
        }
      }
    }

    // key wasn't found
    return Math.floor((start + end) / 2);
  }
}

export class LogFiles {
  files: LogFile[] = [];

  focusedFile: LogFile | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  add(file: LogFile) {
    this.files.push(file);
  }

  delete(file: LogFile) {
    this.files = this.files.filter((f) => f !== file);
  }

  focus(file: LogFile) {
    this.focusedFile = file;
  }

  unfocus(file?: LogFile) {
    if (file?.id === this.focusedFile?.id) {
      this.focusedFile = null;
    }
  }

  selectNearestTimestamp(timestamp: number) {
    this.files.forEach((file) => file.selectNearestTimestamp(timestamp));
  }

  get size() {
    return this.files.length;
  }
}

export const logFileStore = new LogFiles();
const context = createContext(logFileStore);

export function useLogFlieStore() {
  return useContext(context);
}

const logFileNameStore = new LogFileNameStore();

export function useLogFileNameStore() {
  return logFileNameStore;
}
