import React, { createContext, useCallback, useContext, useState } from "react";
export type Line = [string, number, number];
export type LogFile = {
  id: string;
  name: string;
  lines: Line[];
};
type TargetTime = [number, number, number];

interface ILogContext {
  filename?: string;
  setFilename(filename: string): void;
  searchKeywords: string;
  setSearchKeywords(keywords: string): void;
  highlightKeywords: string;
  setHighlightKeywords(keywords: string): void;
  selectedLine: number;
  clearSelectedLine(): void;
  setSelectedLine(val: number): void;
  targetTime: TargetTime;
  setTargetTime(val: number): void;
}

const defaultValue = {
  filename: "",
  setFilename(_filename: string) {},
  searchKeywords: "",
  setSearchKeywords(_keywords: string) {},
  highlightKeywords: "",
  setHighlightKeywords(_keywords: string) {},
  selectedLine: -1,
  setSelectedLine(_val: number) {},
  clearSelectedLine() {},
  targetTime: [0, 0, 0] as TargetTime,
  setTargetTime(_val: number) {},
};

const SingleLogContext = createContext<ILogContext>(defaultValue);

export const useSingleLogContext = () => {
  return useContext(SingleLogContext);
};

export const SingleLogContextProvider: React.FunctionComponent<any> =
  React.memo(({ children }) => {
    const [searchKeywords, setSearchKeywords] = useState(
      defaultValue.searchKeywords
    );
    const [highlightKeywords, setHighlightKeywords] = useState(
      defaultValue.searchKeywords
    );
    const [filename, setFilename] = useState(defaultValue.filename);

    const [selectedLine, setSelectedLine] = useState(defaultValue.selectedLine);
    const [targetTime, setTargetTimeStatus] = useState(defaultValue.targetTime);
    const setTargetTime = useCallback(
      (time: number) => {
        setTargetTimeStatus((prev) => {
          return time === prev[0] ? prev : [time, prev[0], prev[1]];
        });
      },
      [setTargetTimeStatus]
    );

    const clearSelectedLine = useCallback(() => {
      setSelectedLine(defaultValue.selectedLine);
    }, [setSelectedLine]);
    const value = {
      searchKeywords,
      setSearchKeywords,
      highlightKeywords,
      setHighlightKeywords,
      filename,
      setFilename,
      selectedLine,
      setSelectedLine,
      clearSelectedLine,
      targetTime,
      setTargetTime,
    };

    return (
      <SingleLogContext.Provider value={value}>
        {children}
      </SingleLogContext.Provider>
    );
  });

SingleLogContextProvider.displayName = "SingleLogContextProvider";
