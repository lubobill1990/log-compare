import { LogLevel, LogLine } from '@/interface';

export function formatTimestamp(timestamp: number) {
  // parse to hour:minute:second.millisecond
  const date = new Date(timestamp);
  return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date
    .getDate()
    .toString()
    .padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date
    .getMilliseconds()
    .toString()
    .padStart(3, '0')}`;
}

function getDateFromLine(line: string) {
  if (line.startsWith(' ')) {
    return null;
  }

  if (line.search(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}.\d{3} \[/) === 0) {
    const dateString = line.substring(0, 23);
    return { dateString, date: new Date(`${dateString}+00:00`) };
  }

  if (line.search(/\d{4}-\d{2}-\d{2}-\d{2}:\d{2}:\d{2}.\d{3}/) === 0) {
    const dateString = `${line.substring(0, 10)} ${line.substring(11, 23)}`;
    return { dateString, date: new Date(`${dateString}`) };
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

export function getLogLevel(line: string) {
  const webLogIndex = line.search(/(?<=\d{3}Z )(Inf|War|Err) /);
  if (webLogIndex >= 0) {
    return {
      Inf: LogLevel.INFO,
      War: LogLevel.WARN,
      Err: LogLevel.ERROR,
    }[line.slice(webLogIndex, webLogIndex + 3)];
  }

  const desktopLogIndex = line.search(/(?<=-- )(error|warning|event|info) --/);

  if (desktopLogIndex >= 0) {
    return {
      erro: LogLevel.ERROR,
      warn: LogLevel.WARN,
      even: LogLevel.DEBUG,
      info: LogLevel.INFO,
    }[line.slice(desktopLogIndex, desktopLogIndex + 4)];
  }

  return undefined;
}
export function processLine(line: string, index: number) {
  const res = getDateFromLine(line);
  if (res === null) {
    return new LogLine(0, line, index);
  }
  const { date, dateString } = res;
  const timestamp = date.getTime();

  const thisLine: string = `${formatTimestamp(timestamp)} - ${line.slice(
    dateString.length
  )}`;

  return new LogLine(timestamp, thisLine, index, getLogLevel(line));
}

export function getLinesFromContent(content: string) {
  const rawLines = content.split('\n');
  if (rawLines.length === 0) {
    return [];
  }
  let previousTimestamp = 0;
  const lineIndexesNeedReprocess: number[] = [];
  const logLines = rawLines.map((line, index) => {
    const logLine = processLine(line, index);
    if (logLine.timestamp === 0) {
      if (previousTimestamp !== 0) {
        logLine.timestamp = previousTimestamp;
        logLine.content = `${formatTimestamp(previousTimestamp)} - ${
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
      logLine.content = `${formatTimestamp(nextLine.timestamp)} - ${
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
