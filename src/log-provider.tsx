import React, { createContext, useCallback, useContext, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export type Line = [string, number];
export type LogFile = {
  id: string;
  name: string;
  lines: Line[];
};

interface ILogContext {
  logFiles: Map<string, LogFile>;
  addLogFile(name: string, content: string): void;
  delLogFile(id: string): void;
  scrollToTimestamp: number;
  setScrollToTimestamp(val: number): void;
  searchKeywords: string[];
  setSearchKeywords(keywords: string[]): void;
  activeLogFileId: string;
  setActiveLogFileId(id: string): void;
}

const defaultValue = {
  logFiles: new Map(),
  addLogFile() {},
  delLogFile() {},
  scrollToTimestamp: 0,
  setScrollToTimestamp(_val: number) {},

  searchKeywords: [],
  setSearchKeywords(_keywords: string[]) {},

  activeLogFileId: "string",
  setActiveLogFileId(_id: string) {},
};

const LogContext = createContext<ILogContext>(defaultValue);

export const useLogContext = () => {
  return useContext(LogContext);
};

export const LogContextProvider: React.FunctionComponent<any> = React.memo(
  ({ children }) => {
    const [logFiles, setLogFiles] = useState(defaultValue.logFiles);
    const [scrollToTimestamp, setScrollToTimestamp] = useState(
      defaultValue.scrollToTimestamp
    );
    const [searchKeywords, setSearchKeywords] = useState<string[]>([]);
    const [activeLogFileId, setActiveLogFileId] = useState(
      defaultValue.activeLogFileId
    );
    const addLogFile = useCallback(
      (name: string, content: string) => {
        setLogFiles((prev) => {
          const rawLines = content.split("\n");
          let currentTimestamp = Number.MAX_SAFE_INTEGER;
          const lines = rawLines.map((line) => {
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
            return [thisLine, timestamp];
          });
          const id = uuidv4();
          return new Map(prev).set(id, {
            lines,
            name,
            id,
          });
        });
      },
      [setLogFiles]
    );

    const delLogFile = useCallback(
      (id: string) => {
        setLogFiles((prev) => {
          const newMap = new Map(prev);
          newMap.delete(id);
          return newMap;
        });
      },
      [setLogFiles]
    );

    const value = {
      delLogFile,
      logFiles,
      addLogFile,
      scrollToTimestamp,
      setScrollToTimestamp,
      searchKeywords,
      setSearchKeywords,
      activeLogFileId,
      setActiveLogFileId,
    };

    return <LogContext.Provider value={value}>{children}</LogContext.Provider>;
  }
);

LogContextProvider.displayName = "LogContextProvider";
