/* eslint-disable max-classes-per-file */
import { makeAutoObservable } from 'mobx';
import { createContext, useContext } from 'react';
import getSha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';

import { LogLine } from '@/interface';
import { binarySearchClosestLog, formatTimestamp } from '@/util';
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

function getDateFromLine(line: string) {
  if (line.search(/^\s/) === 0) {
    return null;
  }

  for (let i = 57; i > 23; i -= 1) {
    const dateString = line.substring(0, i);
    const date = new Date(dateString);
    if (date.toString() !== 'Invalid Date') {
      return { dateString, date };
    }
  }
  return null;
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

  private formatTimestamp(timestamp: number) {
    // parse to hour:minute:second.millisecond
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date
      .getMinutes()
      .toString()
      .padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date
      .getMilliseconds()
      .toString()
      .padStart(3, '0')}`;
  }

  private processLine(line: string, index: number) {
    const res = getDateFromLine(line);
    if (res === null) {
      return new LogLine(0, line, index);
    }
    const { date, dateString } = res;
    const timestamp = date.getTime();

    const thisLine: string = `${this.formatTimestamp(timestamp)} - ${line.slice(
      dateString.length
    )}`;

    return new LogLine(timestamp, thisLine, index);
  }

  private getLinesFromContent(content: string) {
    const rawLines = content.split('\n');
    if (rawLines.length === 0) {
      return [];
    }
    let previousTimestamp = 0;
    const lineIndexesNeedReprocess: number[] = [];
    const logLines = rawLines.map((line, index) => {
      const logLine = this.processLine(line, index);
      if (logLine.timestamp === 0) {
        if (previousTimestamp !== 0) {
          logLine.timestamp = previousTimestamp;
          logLine.content = `${this.formatTimestamp(previousTimestamp)} - ${
            logLine.content
          }`;
        } else {
          lineIndexesNeedReprocess.push(index);
        }
      } else {
        previousTimestamp = logLine.timestamp;
      }
      return logLine;
    });

    // iterate on the lines that need reprocess from the end to the beginning
    for (let i = lineIndexesNeedReprocess.length - 1; i >= 0; i -= 1) {
      const index = lineIndexesNeedReprocess[i];
      const logLine = logLines[index];
      const nextLine = logLines[index + 1];
      if (nextLine?.timestamp > 0) {
        logLine.timestamp = nextLine.timestamp;
        logLine.content = `${this.formatTimestamp(nextLine.timestamp)} - ${
          logLine.content
        }`;
      }
    }

    // compare the timestamp between the last and the first
    // if the first is smaller than the last, reverse the lines
    // if the first is bigger than the last, do nothing
    // if the first is equal to the last, do nothing
    const orderDiffSum =
      logLines[0].timestamp - logLines[logLines.length - 1].timestamp;

    return orderDiffSum < 0
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

  selectNearestTimestamp(targetTimestamp: number) {
    const lineIndex = this.getClosestLineIndexFromTimestmap(targetTimestamp);
    const nearestTimestamp = this.filteredLines[lineIndex]?.timestamp;
    console.log(
      'selectNearestTimestamp',
      formatTimestamp(nearestTimestamp),
      formatTimestamp(targetTimestamp),
      lineIndex
    );
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

  get filteredLineIndexOfSelectedTimestamp() {
    return this.getClosestLineIndexFromTimestmap(this.selectedTimestamp);
  }

  get searchKeywordsArray() {
    return [
      this.filter.searchKeywords,
      this.globalFilter.searchKeywords,
    ].filter((v) => v);
  }

  getClosestLineFromTimestamp(targetTimestamp: number) {
    const index = this.getClosestLineIndexFromTimestmap(targetTimestamp);
    return this.filteredLines[index];
  }

  getClosestLineIndexFromTimestmap(targetTimestamp: number) {
    return binarySearchClosestLog(this.filteredLines, targetTimestamp, true);
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
