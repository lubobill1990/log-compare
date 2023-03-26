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
import {
  SharedStateStore,
  sharedStateStore as globalSharedStateStore,
} from './shared-state';

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

  filter = new Filter('', '', '', false);

  enableSyncTime = true;

  selectedLines = [0, 0, 0];

  selectedTimestamps = [0, 0, 0];

  nearestTimestamp = Number.MAX_SAFE_INTEGER;

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
          this.filtering = true;
        });
      }),
      proxy((lineCount: number) => {
        runInAction(() => {
          this.filtering = false;
          this.filteredLinesLength = lineCount;
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

    this.content = '';
  }

  dispose() {
    this.autoRunManager.dispose();
    this.filterWorker.terminate();
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

  get highligher() {
    return new ContentHighlighter([
      ...this.filterStrings,
      ...this.highlightKeywords,
    ]).highlightContent;
  }

  highlightContent(content: string) {
    return this.highligher(content);
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
    this.nearestTimestamp = targetTimestamp;
    if (this.enableSyncTime) {
      this.filterWorker.selectNearestTimestamp(targetTimestamp);
    }
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const b =
      this.filterStrings ||
      this.pinedLines ||
      this.appendFilteredLine ||
      Date.now();
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

  setEnableSyncTime(enable: boolean) {
    this.enableSyncTime = enable;
    if (enable) {
      this.filterWorker.selectNearestTimestamp(this.nearestTimestamp);
    }
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

export class LogFiles {
  files: LogFile[] = [];

  focusedFile: LogFile | null = null;

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
  }

  add(file: LogFile) {
    this.files.push(file);
    file.init();
    this.selectNearestTimestamp(this.sharedStateStore.focusTimestamp);
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
