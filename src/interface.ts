export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export class LogLine {
  constructor(
    public timestamp: number,
    public content: string,
    public lineNumber: number,
    public level?: LogLevel
  ) {}
}
