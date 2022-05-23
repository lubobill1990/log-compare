import React, { useCallback, useEffect } from "react";
import "./App.css";
import { LogFile, useLogContext } from "./GlobalLogProvider";
import { useSingleLogContext } from "./SingleLogProvider";

export const LogFileHeader = (props: { file: LogFile }) => {
  const { file } = props;
  const { delLogFile } = useLogContext();
  const {
    setHighlightKeywords,
    setSearchKeywords,
    searchKeywords: filterKeywords,
    filename,
    setFilename,
  } = useSingleLogContext();
  const closeLog = useCallback(() => {
    delLogFile(file.id);
  }, [file.id, delLogFile]);

  const onHighlightKeywordsChanged = useCallback(
    (e: React.ChangeEvent) => {
      setHighlightKeywords((e.target as HTMLInputElement).value);
    },
    [setHighlightKeywords]
  );

  const onFilterKeywordsChanged = useCallback(
    (e: React.ChangeEvent) => {
      setSearchKeywords((e.target as HTMLInputElement).value);
    },
    [setSearchKeywords]
  );

  const onTitleChanged = useCallback(
    (e: React.ChangeEvent) => {
      setFilename((e.target as HTMLInputElement).value);
    },
    [setFilename]
  );

  useEffect(() => {
    setFilename(file.name);
  }, [file.name, setFilename]);
  return (
    <div className="log-header">
      <div className="title">
        <input type="text" value={filename} onChange={onTitleChanged} />
      </div>
      <div className="log-filters">
        <div className="log-filter">
          <label htmlFor="">Filters:</label>
          <input
            type="text"
            onChange={onFilterKeywordsChanged}
            placeholder="Separate with `,`"
            value={filterKeywords}
          />
        </div>
        <div className="log-filter">
          <label htmlFor="">Highlights:</label>
          <input
            type="text"
            onChange={onHighlightKeywordsChanged}
            placeholder="Separate with `,`"
          />
        </div>
      </div>
      <div className="close" onClick={closeLog}>
        ✕
      </div>
    </div>
  );
};
