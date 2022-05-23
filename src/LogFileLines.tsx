import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import { Line, LogFile, useLogContext } from "./GlobalLogProvider";
import {
  FixedSizeList,
  FixedSizeList as List,
  ListOnItemsRenderedProps,
} from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { useSingleLogContext } from "./SingleLogProvider";
import { LogLineRow } from "./LogLineRow";
import { binarySearchClosestLog } from "./util";

function getKeywordsListLowerCase(value: string) {
  return value
    .toLowerCase()
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v);
}

function filterLinesOnKeywords(lines: Line[], search: string) {
  if (search.startsWith("/") && search.endsWith("/") && search.length > 2) {
    const searches = search
      .slice(1, -1)
      .split("/&&/")
      .map((s) => new RegExp(s));
    return lines.filter((line) => {
      return searches.every((reg) => line[0].search(reg) > -1);
    });
  }
  const keywordsList = getKeywordsListLowerCase(search);
  if (keywordsList.length === 0) {
    return lines;
  } else {
    return lines.filter((line) => {
      const lowerLine = line[0].toLowerCase();
      return keywordsList.some((keyword) => lowerLine.indexOf(keyword) >= 0);
    });
  }
}

export function LogFileLines(props: { file: LogFile }) {
  const { file } = props;
  const {
    searchKeywords,
    scrollToTimestamp,
    setScrollToTimestamp,
    activeLogFileId,
  } = useLogContext();
  const [filteredLines, setFilteredLines] = useState<Line[]>([]);
  const {
    searchKeywords: filterKeywords,
    selectedLine,
    clearSelectedLine,
    setTargetTime,
  } = useSingleLogContext();

  useEffect(() => {
    setFilteredLines(
      filterLinesOnKeywords(
        filterLinesOnKeywords(file.lines, searchKeywords),
        filterKeywords
      )
    );
  }, [searchKeywords, setFilteredLines, file.lines, filterKeywords]);

  const isOperatingOnThisFileLog = activeLogFileId === file.id;
  const onItemsRendered = useCallback(
    (e: ListOnItemsRenderedProps) => {
      const { visibleStartIndex, visibleStopIndex } = e;
      const scrollOffsetIndex = Math.floor(
        (visibleStartIndex + visibleStopIndex) / 2
      );
      if (filteredLines[scrollOffsetIndex]) {
        setTargetTime(filteredLines[scrollOffsetIndex][1]);
        const timestamp = filteredLines[scrollOffsetIndex][1];
        if (isOperatingOnThisFileLog) {
          setScrollToTimestamp(timestamp);
        }
      }
    },
    [
      filteredLines,
      setScrollToTimestamp,
      setTargetTime,
      isOperatingOnThisFileLog,
    ]
  );
  const listRef = useRef<FixedSizeList>(null);

  useEffect(() => {
    if (isOperatingOnThisFileLog) {
      if (selectedLine >= 0) {
        const localTargetIndex = binarySearchClosestLog(
          filteredLines,
          selectedLine,
          2,
          false
        );
        console.log("localTargetIndex", localTargetIndex, selectedLine);
        if (filteredLines[localTargetIndex]) {
          setTargetTime(filteredLines[localTargetIndex][1]);
        }
        if (listRef.current) {
          listRef.current.scrollToItem(localTargetIndex, "smart");
        }
      }
    } else {
      const localTargetIndex = binarySearchClosestLog(
        filteredLines,
        scrollToTimestamp
      );
      if (filteredLines[localTargetIndex]) {
        setTargetTime(filteredLines[localTargetIndex][1]);
      }
      if (listRef.current) {
        listRef.current.scrollToItem(localTargetIndex, "center");
      }
    }
  }, [
    isOperatingOnThisFileLog,
    filteredLines,
    scrollToTimestamp,
    setTargetTime,
    listRef,
    selectedLine,
  ]);

  const onClearSelectedLine = useCallback(() => {
    clearSelectedLine();
  }, [clearSelectedLine]);

  return (
    <div className="lines" onWheel={onClearSelectedLine}>
      <AutoSizer>
        {({ height, width }: { height: number; width: number }) => (
          <List
            ref={listRef}
            className="List"
            itemCount={filteredLines.length}
            itemSize={15}
            itemData={{
              lines: filteredLines,
            }}
            height={height}
            width={width}
            onItemsRendered={onItemsRendered}
          >
            {LogLineRow}
          </List>
        )}
      </AutoSizer>
    </div>
  );
}
