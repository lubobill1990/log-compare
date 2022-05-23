import React, { createContext, useContext, useState } from "react";
export type Line = [string, number, number];
export type LogFile = {
  id: string;
  name: string;
  lines: Line[];
};

interface ILogContext {
  filename?: string;
  setFilename(filename: string): void;
  searchKeywords: string;
  setSearchKeywords(keywords: string): void;
  highlightKeywords: string;
  setHighlightKeywords(keywords: string): void;
}

const defaultValue = {
  filename: "",
  setFilename(_filename: string) {},
  searchKeywords: "",
  setSearchKeywords(_keywords: string) {},
  highlightKeywords: "",
  setHighlightKeywords(_keywords: string) {},
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

    const value = {
      searchKeywords,
      setSearchKeywords,
      highlightKeywords,
      setHighlightKeywords,
      filename,
      setFilename,
    };

    return (
      <SingleLogContext.Provider value={value}>
        {children}
      </SingleLogContext.Provider>
    );
  });

SingleLogContextProvider.displayName = "SingleLogContextProvider";
