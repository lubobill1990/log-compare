import React from "react";
import { useCallback } from "react";
import { useLogContext } from "./GlobalLogProvider";

export function GlobalFilter() {
  const {
    setSearchKeywords,
    searchKeywords,
    setHighlightKeywords,
    highlightKeywords,
  } = useLogContext();

  const onGlobalFilterChange = useCallback(
    (e: React.ChangeEvent) => {
      const value = (e.target as HTMLInputElement).value;
      setSearchKeywords(value);
    },
    [setSearchKeywords]
  );

  const onGlobalHighlightKeywordsChange = useCallback(
    (e: React.ChangeEvent) => {
      const value = (e.target as HTMLInputElement).value;
      setHighlightKeywords(value);
    },
    [setHighlightKeywords]
  );
  return (
    <div className="global-footer">
      <div className="keyword-filter">
        <label htmlFor="">Global filters:</label>
        <input
          type="text"
          className="keywords"
          onChange={onGlobalFilterChange}
          placeholder="Separate keydwords with `,`. Regular expression supported as `/search1|search2/`. `AND` condition supported with regular express as `/a/&&/b/`."
          value={searchKeywords}
        />
      </div>
      <div className="global-highlight-keywords">
        <label htmlFor="">Global highlights:</label>
        <input
          type="text"
          className="keywords"
          onChange={onGlobalHighlightKeywordsChange}
          placeholder="Separate with `,`"
          value={highlightKeywords}
        />
      </div>
    </div>
  );
}
