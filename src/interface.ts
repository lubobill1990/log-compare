export class LogLine {
  constructor(
    public timestamp: number,
    public content: string,
    public lineNumber: number
  ) {}
}
