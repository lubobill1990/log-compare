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
import { ContentHighlighter } from './content-highligher';
import { Filter } from './filter';
import { LogFileNameStore } from './log-file-name-store';
import {
  SharedStateStore,
  sharedStateStore as globalSharedStateStore,
} from './shared-state';

export interface ILogFile {
  id: string;
  name: string;
  selectNearestTimestamp(timestamp: number): void;
  setEnableSyncTime(enable: boolean): void;
  init(): void;
  dispose(): void;
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

export class LogFile {
  enableSyncTime = true;

  selectedLines = [0, 0, 0];

  selectedTimestamps = [0, 0, 0];

  nearestTimestamp = Number.MAX_SAFE_INTEGER;

  pinedLines = new Map<number, boolean>();

  private storageProvider: LogFileStorageProvider;

  private filterWorker: any = null;

  filteredLines = {} as { [key: string]: LogLine };

  filteredLineCount = 0;

  isFiltering = false;

  enableFilter = true;

  filteredLineIndexOfSelectedTimestamp = 0;

  private lineIndicesToBeFetched = [] as number[];

  private autoRunManager = new AutoRunManager();

  constructor(
    public globalFilter: Filter,
    public originName: string,
    public content: string,
    public sha1: string,
    public filter: Filter
  ) {
    this.selectedTimestamps[0] = Date.now();
    this.storageProvider = new LogFileStorageProvider(`logFile-${this.sha1}`);
    this.pinedLines = this.storageProvider.loadPinedLines();
    makeAutoObservable(this, {});
  }

  init() {
    this.autoRunManager.autorun(() => {
      if (this.enableFilter) {
        this.filterWorker.setFilterStrings(this.filterStrings);
      } else {
        this.filterWorker.setFilterStrings([]);
      }
    });
    this.filterWorker = new ComlinkWorker<any>(
      new URL('./filter-worker', import.meta.url)
    );

    this.filterWorker.setupLogFileWorker(
      this.content,
      Array.from(this.pinedLines.keys()).map((lineNumber) => lineNumber),
      proxy(() => {
        runInAction(() => {
          this.isFiltering = true;
        });
      }),
      proxy((lineCount: number) => {
        runInAction(() => {
          this.isFiltering = false;
          this.filteredLineCount = lineCount;
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
      })
    );
  }

  dispose() {
    this.autoRunManager.dispose();
    this.filterWorker.terminate();
  }

  get highlightKeywords() {
    return [this.filter.highlightText, this.globalFilter.highlightText]
      .join(',')
      .split(',')
      .map((v) => v.trim())
      .filter((v) => !!v);
  }

  get highligher() {
    return new ContentHighlighter([
      ...this.filterStrings,
      ...this.highlightKeywords,
    ]).highlightContent;
  }

  highlightContent(content: string) {
    return this.highligher(content);
  }

  selectLine(lineNumber: number) {
    this.filterWorker.selectLine(lineNumber);
  }

  selectTimestamp(timestamp: number) {
    this.filterWorker.selectTimestamp(timestamp);
  }

  selectNearestTimestamp(targetTimestamp: number) {
    this.nearestTimestamp = targetTimestamp;
    if (this.enableSyncTime) {
      this.filterWorker.selectNearestTimestamp(targetTimestamp);
    }
  }

  private throttledFetchFilteredLine = throttle(async () => {
    if (this.lineIndicesToBeFetched.length === 0) {
      return;
    }
    const indexArrayToFetch = toJS(this.lineIndicesToBeFetched);
    this.lineIndicesToBeFetched = [];
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const b =
      this.filterStrings ||
      this.pinedLines ||
      this.appendFilteredLine ||
      Date.now();
    return (index: number) => {
      this.lineIndicesToBeFetched.push(index);
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

  setEnableSyncTime(enable: boolean) {
    this.enableSyncTime = enable;
    if (enable) {
      this.filterWorker.selectNearestTimestamp(this.nearestTimestamp);
    }
  }

  setEnableFilter(enable: boolean) {
    this.enableFilter = enable;
  }

  get filterStrings() {
    return [
      ...this.filter.enabledSearchPatterns,
      ...this.globalFilter.enabledSearchPatterns,
    ];
  }

  get selectedLineNumber() {
    return this.selectedLines[0];
  }

  get selectedTimestamp() {
    return this.selectedTimestamps[0];
  }
}

export class LogFile1 implements ILogFile {
  id = uuidv4();

  filteredFile: LogFile;

  nonFilteredFile: LogFile;

  enableSyncTime = true;

  sha1: string;

  private customizedName: string;

  constructor(
    private logFileNameStore: LogFileNameStore,
    private logFiles: LogFiles,
    private globalFilter: Filter,
    private originName: string,
    private content: string,
    public filter = new Filter('', '', '', false)
  ) {
    this.sha1 = getSha1(content) as string;

    this.filteredFile = new LogFile(
      this.globalFilter,
      this.originName,
      this.content,
      this.sha1,
      this.filter
    );
    this.nonFilteredFile = new LogFile(
      this.globalFilter,
      this.originName,
      this.content,
      this.sha1,
      this.filter
    );
    this.nonFilteredFile.setEnableFilter(false);

    this.customizedName = logFileNameStore.getFileName(this.sha1);

    makeAutoObservable(this, {}, { autoBind: true });
  }

  selectNearestTimestamp(targetTimestamp: number) {
    this.filteredFile.selectNearestTimestamp(targetTimestamp);
    this.nonFilteredFile.selectNearestTimestamp(targetTimestamp);
  }

  setEnableSyncTime(enable: boolean) {
    this.enableSyncTime = enable;
    this.filteredFile.setEnableSyncTime(enable);
    this.nonFilteredFile.setEnableSyncTime(enable);
  }

  delete() {
    this.logFiles.delete(this);
  }

  init() {
    this.filteredFile.init();
    this.nonFilteredFile.init();
  }

  dispose() {
    this.filteredFile.dispose();
    this.nonFilteredFile.dispose();
  }

  get name() {
    return this.customizedName || this.originName;
  }

  set name(name: string) {
    this.customizedName = name;
    this.logFileNameStore.setFileName(this.nonFilteredFile.sha1, name);
  }
}

export class LogFiles {
  files: LogFile1[] = [];

  focusedFile: LogFile1 | null = null;

  autoRunManager = new AutoRunManager();

  constructor(private sharedStateStore: SharedStateStore) {
    makeAutoObservable(this);
  }

  init() {
    this.autoRunManager.reaction(
      () => this.sharedStateStore.focusTimestamp,
      (focusTimestamp) => {
        this.selectNearestTimestamp(focusTimestamp);
      }
    );
  }

  dispose() {
    this.autoRunManager.dispose();

    this.files.forEach((file) => file.dispose());
  }

  add(file: LogFile1) {
    this.files.push(file);
    file.init();
    this.selectNearestTimestamp(this.sharedStateStore.focusTimestamp);
  }

  delete(file: LogFile1) {
    file.dispose();
    this.files = this.files.filter((f) => f !== file);
  }

  selectNearestTimestamp(timestamp: number) {
    this.files.forEach((file) => file.selectNearestTimestamp(timestamp));
  }

  get size() {
    return this.files.length;
  }
}

export const logFilesStore = new LogFiles(globalSharedStateStore);
logFilesStore.init();
const context = createContext(logFilesStore);

export function useLogFliesStore() {
  return useContext(context);
}

const logFileNameStore = new LogFileNameStore();

export function useLogFileNameStore() {
  return logFileNameStore;
}
