/* eslint-disable max-classes-per-file */
import { proxy } from 'comlink';
import { throttle } from 'lodash';
import { makeAutoObservable, runInAction, toJS } from 'mobx';
import { createContext, useContext } from 'react';
import getSha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';

import { LogLine } from '@/interface';
import { StorageProvider } from '@/utils/storage-provider';

import { AutoRunManager } from './autorun-manager';
import { Filter } from './filter';

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
  id = uuidv4();

  filter = new Filter();

  selectedLines = [0, 0, 0];

  selectedTimestamps = [0, 0, 0];

  pinedLines = new Map<number, boolean>();

  private storageProvider: LogFileStorageProvider;

  private filterWorker: any = null;

  filteredLines = {} as { [key: string]: LogLine };

  filteredLinesLength = 0;

  filtering = false;

  filteredLineIndexOfSelectedTimestamp = 0;

  private pendingFilteredLinesIndexArray = [] as number[];

  private autoRunManager = new AutoRunManager();

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
    this.storageProvider = new LogFileStorageProvider(`logFile-${this.sha1}`);
    this.pinedLines = this.storageProvider.loadPinedLines();
    makeAutoObservable(this, {});
  }

  init() {
    this.autoRunManager.autorun(() => {
      runInAction(() => {
        this.filtering = true;
      });
      this.filterWorker.setFilterStrings(this.filterStrings);
    });
    this.filterWorker = new ComlinkWorker<any>(
      new URL('./filter-worker', import.meta.url)
    );

    this.filterWorker.setupLogFileWorker(
      this.content,
      Array.from(this.pinedLines.keys()).map((lineNumber) => lineNumber),
      proxy(() => {
        runInAction(() => {
          this.filteredLines = {};
          this.pendingFilteredLinesIndexArray = [];
          this.filtering = false;
        });
      }),
      proxy((selectedLines: any, selectedTimestamps: any) => {
        runInAction(() => {
          this.selectedLines = selectedLines;
          this.selectedTimestamps = selectedTimestamps;
        });
      }),
      proxy((val: any) => {
        runInAction(() => {
          this.filteredLineIndexOfSelectedTimestamp = val;
        });
      }),
      proxy((val: any) => {
        runInAction(() => {
          this.filteredLinesLength = val;
        });
      })
    );
  }

  dispose() {
    this.autoRunManager.dispose();
  }

  addExpandedLineRange(start: number, end: number) {
    this.filterWorker.addExpandedLineRange(start, end);
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
    this.filterWorker.selectLine(lineNumber);
  }

  selectTimestamp(timestamp: number) {
    this.filterWorker.selectTimestamp(timestamp);
  }

  selectNearestTimestamp(targetTimestamp: number) {
    this.filterWorker.selectNearestTimestamp(targetTimestamp);
  }

  private throttledFetchFilteredLine = throttle(async () => {
    if (this.pendingFilteredLinesIndexArray.length === 0) {
      return;
    }
    const indexArrayToFetch = toJS(this.pendingFilteredLinesIndexArray);
    this.pendingFilteredLinesIndexArray = [];
    const filteredLines = (await this.filterWorker.fetchFilteredLine(
      indexArrayToFetch
    )) as Record<string, LogLine>;
    // for each record in filteredLines, add it to this.filteredLines
    runInAction(() => {
      this.appendFilteredLine(filteredLines);
    });
  }, 50);

  appendFilteredLine(filteredLines: Record<number, LogLine>) {
    Object.entries(filteredLines).forEach(([key, value]) => {
      this.filteredLines[key] = value;
    });
  }

  get fetchFilteredLine() {
    const b =
      this.filterStrings ||
      this.pinedLines ||
      this.appendFilteredLine ||
      Date.now();
    console.log(b);
    return (index: number) => {
      this.pendingFilteredLinesIndexArray.push(index);
      this.throttledFetchFilteredLine();
    };
  }

  pinLine(lineNumber: number) {
    this.filterWorker.setPinedLine(lineNumber, true);
    this.pinedLines.set(lineNumber, true);
    this.storageProvider.savePinedLines(this.pinedLines);
  }

  unpinLine(lineNumber: number) {
    this.filterWorker.setPinedLine(lineNumber, false);
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

  get filterStrings() {
    return [
      ...this.filter.searchKeywords.split(','),
      ...this.globalFilter.searchKeywords.split(','),
    ];
  }

  get selectedLineNumber() {
    return this.selectedLines[0];
  }

  get selectedTimestamp() {
    return this.selectedTimestamps[0];
  }

  get searchKeywordsArray() {
    return [
      this.filter.searchKeywords,
      this.globalFilter.searchKeywords,
    ].filter((v) => v);
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
    file.init();
  }

  delete(file: LogFile) {
    file.dispose();
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
