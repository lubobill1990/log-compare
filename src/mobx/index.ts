import { makeAutoObservable } from "mobx";
import { v4 as uuidv4 } from "uuid";
import getSha1 from "sha1";

export class Filter {
  searchKeywords = "";
  hightlightText = "";

  constructor() {
    makeAutoObservable(this);
  }

  setSearchKeywords(searchKeywords: string) {
    this.searchKeywords = searchKeywords;
  }
  setHightlightText(hightlightText: string) {
    this.hightlightText = hightlightText;
  }
}

export class SharedState {
  globalFilter = new Filter();
  focusTimestamp: number = 0;
  id = uuidv4();
  updatedBy?: string = undefined;

  constructor() {
    makeAutoObservable(this);
  }
}

export class LogLine {
  constructor(
    public timestamp: number,
    public content: string,
    public lineNumber: number
  ) {}
}

export class LogFileNameStore {
  private getStorageKey() {
    return `logFilenameMapping`;
  }
  private getFileNameMapping() {
    const value = localStorage.getItem(this.getStorageKey());
    if (value) {
      return JSON.parse(value) as Record<string, string>;
    }
    return {};
  }
  getFileName(sha1: string) {
    return this.getFileNameMapping()[sha1];
  }
  setFileName(sha1: string, fileName: string) {
    const mapping = this.getFileNameMapping();
    mapping[sha1] = fileName;
    localStorage.setItem(this.getStorageKey(), JSON.stringify(mapping));
  }
}

export class LogFile {
  lines: LogLine[] = [];
  id = uuidv4();
  filter = new Filter();
  constructor(
    public logFileNameStore: LogFileNameStore,
    public logFiles: LogFiles,
    public globalFilter: Filter,
    public originName: string,
    public content: string,
    public sha1 = getSha1(content) as string,
    public customizedName = logFileNameStore.getFileName(sha1)
  ) {
    this.lines = this.getLinesFromContent(content);
    makeAutoObservable(this, {
      logFiles: false,
      logFileNameStore: false,
      lines: false,
    });
  }

  private getLinesFromContent(content: string) {
    const rawLines = content.split("\n");
    let currentTimestamp = Number.MAX_SAFE_INTEGER;
    return rawLines.map((line, index) => {
      let thisLine = line;
      const timestampEndIndex = line.indexOf(" ");
      const date = new Date(line.slice(0, timestampEndIndex));
      let timestamp = date.getTime();

      if (!timestamp) {
        timestamp = currentTimestamp;
      } else {
        currentTimestamp = timestamp;

        thisLine = `${date.getHours().toString().padStart(2, "0")}:${date
          .getMinutes()
          .toString()
          .padStart(2, "0")}:${date
          .getSeconds()
          .toString()
          .padStart(2, "0")}.${date
          .getMilliseconds()
          .toString()
          .padStart(3, "0")} - ${line.slice(timestampEndIndex)}`;
      }
      return new LogLine(timestamp, thisLine, index);
    });
  }

  get hightlightKeywords() {
    return [this.filter.hightlightText, this.globalFilter.hightlightText]
      .join(",")
      .split(",")
      .map((v) => v.trim())
      .filter((v) => !!v);
  }

  highlightContent(content: string) {
    return this.hightlightKeywords.reduce((acc, keyword, currentIndex) => {
      const colorIndex = (currentIndex % 18) + 1;
      return acc.replace(keyword, `<b class="c${colorIndex}">${keyword}</b>`);
    }, content);
  }

  delete() {
    this.logFiles.delete(this);
  }
  focus() {
    this.logFiles.focus(this);
  }
  get isFocused() {
    return this.logFiles.focusedFile !== undefined;
  }
  get name() {
    return this.customizedName || this.originName;
  }
  set name(name: string) {
    this.customizedName = name;
    this.logFileNameStore.setFileName(this.sha1, name);
  }
  getFilteredLines() {}
}

export class LogFiles {
  files: LogFile[] = [];
  focusedFile: LogFile | undefined = undefined;

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
  get size() {
    return this.files.length;
  }
}
