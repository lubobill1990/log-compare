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

function getKeywordsListLowerCase(value: string) {
  return value
    .toLowerCase()
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v);
}

function filterLinesOnKeywords(lines: LogLine[], search: string) {
  if (search.startsWith("/") && search.endsWith("/") && search.length > 2) {
    const searches = search
      .slice(1, -1)
      .split("/&&/")
      .map((s) => new RegExp(s));
    return lines.filter((line) => {
      return searches.every((reg) => line.content.search(reg) > -1);
    });
  }
  const keywordsList = getKeywordsListLowerCase(search);
  if (keywordsList.length === 0) {
    return lines;
  } else {
    return lines.filter((line) => {
      const lowerLine = line.content.toLowerCase();
      return keywordsList.some((keyword) => lowerLine.indexOf(keyword) >= 0);
    });
  }
}

function getDateFromLine(
  line: string,
  previousDate: Date,
  startFromIndex: number = 57
) {
  if (line.search(/^\s/) === 0) {
    return { dateString: "", date: previousDate };
  }
  if (startFromIndex === 0) {
    startFromIndex = 57;
  }
  startFromIndex = Math.min(startFromIndex, line.length);
  for (let i = startFromIndex; i > 23; i--) {
    const dateString = line.substring(0, i);
    const date = new Date(dateString);
    if (date.toString() !== "Invalid Date") {
      return { dateString, date };
    }
  }
  return { dateString: "", date: previousDate };
}

const minimumValidTimestamp = new Date("2020-01-01").getTime();
const maximumValidTimestamp = new Date().getTime();

function isValidTimestamp(timestamp: number) {
  return timestamp > minimumValidTimestamp && timestamp < maximumValidTimestamp;
}

export class LogFile {
  lines: LogLine[] = [];
  id = uuidv4();
  filter = new Filter();
  selectedLines = [0, 0, 0];
  selectedTimestamps = [0, 0, 0];

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
    let previousDate = new Date();
    let previousDateString = "";
    let orderDiffSum = 0;
    const logLines = rawLines.map((line, index) => {
      let thisLine = line;
      const { date, dateString } = getDateFromLine(
        line,
        previousDate,
        previousDateString.length
      );
      let timestamp = date.getTime();

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

      thisLine = `${date.getHours().toString().padStart(2, "0")}:${date
        .getMinutes()
        .toString()
        .padStart(2, "0")}:${date
        .getSeconds()
        .toString()
        .padStart(2, "0")}.${date
        .getMilliseconds()
        .toString()
        .padStart(3, "0")} - ${line.slice(dateString.length)}`;
      return new LogLine(timestamp, thisLine, index);
    });

    return orderDiffSum > 0 ? logLines.reverse() : logLines;
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

  selectLine(lineNumber: number) {
    if (this.selectedLines[0] !== lineNumber) {
      this.selectedLines.unshift(lineNumber);
      this.selectedLines.pop();
    }
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

  get filteredLines() {
    return filterLinesOnKeywords(
      filterLinesOnKeywords(this.lines, this.filter.searchKeywords),
      this.globalFilter.searchKeywords
    );
  }
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
