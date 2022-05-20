import React, { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import { Line, LogFile, useLogContext } from "./log-provider";
import { DropTargetMonitor, useDrop } from "react-dnd";
import { NativeTypes } from "react-dnd-html5-backend";
import {
  FixedSizeList,
  FixedSizeList as List,
  ListOnItemsRenderedProps,
} from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
type TargetTime = [number, number, number];

interface IRowProps {
  index: number;
  style: any;
  data: {
    lines: Line[];
    targetTime: TargetTime;
    setTargetTime(val: number): void;
  };
}

const Row = (props: IRowProps) => {
  const {
    index,
    style,
    data: { lines, targetTime, setTargetTime },
  } = props;
  const { setScrollToTimestamp } = useLogContext();
  const content = lines[index][0];
  const time = lines[index][1];
  const lineNumber = lines[index][2];
  const onClick = useCallback(() => {
    setScrollToTimestamp(time);
    setTargetTime(time);
  }, [time, setScrollToTimestamp, setTargetTime]);
  return (
    <div
      className={[
        "line",
        index % 2 ? "odd" : "even",
        targetTime[0] === time ? "target" : "",
        targetTime[1] === time ? "prev-1" : "",
        targetTime[2] === time ? "prev-2" : "",
      ].join(" ")}
      key={index}
      style={style}
      onClick={onClick}
    >
      <div className="count">{lineNumber}</div>
      <div className="content">{content}</div>
    </div>
  );
};

function binarySearchClosestLog(
  orderedLogLines: Line[],
  timestamp: number,
  isInvertedOrder: boolean = true
) {
  let start = 0;
  let end = orderedLogLines.length - 1;

  if (isInvertedOrder) {
    while (start <= end) {
      let middleIndex = Math.floor((start + end) / 2);
      let middleValue = orderedLogLines[middleIndex][1];
      if (middleValue === timestamp) {
        // found the key
        return middleIndex;
      } else if (middleValue < timestamp) {
        // continue searching to the right
        end = middleIndex - 1;
      } else {
        // search searching to the left
        start = middleIndex + 1;
      }
    }
  } else {
    while (start <= end) {
      let middleIndex = Math.floor((start + end) / 2);
      let middleValue = orderedLogLines[middleIndex][1];
      if (middleValue === timestamp) {
        // found the key
        return middleIndex;
      } else if (middleValue < timestamp) {
        // continue searching to the right
        start = middleIndex + 1;
      } else {
        // search searching to the left
        end = middleIndex - 1;
      }
    }
  }

  // key wasn't found
  return Math.floor((start + end) / 2);
}

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

function LogFileContainer(props: { file: LogFile }) {
  const { file } = props;
  const {
    searchKeywords,
    scrollToTimestamp,
    setScrollToTimestamp,
    setActiveLogFileId,
    activeLogFileId,
  } = useLogContext();
  const [targetTime, setTargetTimeStatus] = useState<TargetTime>([0, 0, 0]);
  const [filteredLines, setFilteredLines] = useState<Line[]>([]);

  const setTargetTime = useCallback(
    (time: number) => {
      setTargetTimeStatus((prev) => {
        return time === prev[0] ? prev : [time, prev[0], prev[1]];
      });
    },
    [setTargetTimeStatus]
  );
  useEffect(() => {
    setFilteredLines(filterLinesOnKeywords(file.lines, searchKeywords));
  }, [searchKeywords, setFilteredLines, file.lines]);

  const isOperatingOnThisFileLog = activeLogFileId === file.id;
  const onItemsRendered = useCallback(
    (e: ListOnItemsRenderedProps) => {
      const { visibleStartIndex, visibleStopIndex } = e;
      const scrollOffsetIndex =
        Math.floor(visibleStartIndex + visibleStopIndex) / 2;

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
    if (!isOperatingOnThisFileLog) {
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
  ]);

  const onMouseEnter = useCallback(() => {
    setActiveLogFileId(file.id);
  }, [file.id, setActiveLogFileId]);

  return (
    <div className="file-wrapper" onMouseEnter={onMouseEnter}>
      <div className="title">{file.name}</div>
      <div className="lines">
        <AutoSizer>
          {({ height, width }: { height: number; width: number }) => (
            <List
              ref={listRef}
              className="List"
              itemCount={filteredLines.length}
              itemSize={15}
              itemData={{
                targetTime,
                lines: filteredLines,
                setTargetTime,
              }}
              height={height}
              width={width}
              onItemsRendered={onItemsRendered}
            >
              {Row}
            </List>
          )}
        </AutoSizer>
      </div>
    </div>
  );
}

function useFileDropzone() {
  const { addLogFile } = useLogContext();

  const [, dropRef] = useDrop(
    () => ({
      accept: [NativeTypes.FILE, NativeTypes.URL],
      drop(item, _monitor) {
        const files = (item as any).files as File[];
        if (files) {
          files.forEach((file) => {
            const reader = new FileReader();
            // dropRef.current.getBoundingClientRect()
            reader.onabort = () => console.log("file reading was aborted");
            reader.onerror = () => console.log("file reading has failed");
            reader.onload = () => {
              // Do whatever you want with the file contents
              if (reader.result) {
                console.log(reader.result.slice(0, 100));
                addLogFile(file.name, reader.result as string);
              }
            };
            reader.readAsText(file);
          });
        }
        return undefined;
      },
      hover(_item, _monitor) {},
      canDrop(_item: any) {
        return true;
      },
      collect: (monitor: DropTargetMonitor) => {
        return {
          isOver: monitor.isOver(),
          canDrop: monitor.canDrop(),
        };
      },
    }),
    [addLogFile]
  );
  return dropRef;
}

function App() {
  const { logFiles, setSearchKeywords, searchKeywords } = useLogContext();
  const dropRef = useFileDropzone();

  const onChange = useCallback(
    (e: React.ChangeEvent) => {
      const value = (e.target as HTMLInputElement).value;
      setSearchKeywords(value);
    },
    [setSearchKeywords]
  );
  return (
    <div className="App" ref={dropRef}>
      <div className="vertical-compare-zone">
        {logFiles.size === 0 && (
          <div className="dropzone-hint">
            <div>Drop log files here</div>
            <div className="ensure-hint">
              To compare log files with timestamp locally, safely, and
              efficiently.
              <br />
              Multiple tabs comparing supported.
            </div>
          </div>
        )}
        {Array.from(logFiles.keys()).map((key) => {
          const logFile = logFiles.get(key);
          if (logFile) {
            return (
              <LogFileContainer key={key} file={logFile}></LogFileContainer>
            );
          }
          return <></>;
        })}
      </div>
      <div className="keyword-filter">
        <label htmlFor="">Filter keywords: </label>
        <input
          type="text"
          className="keywords"
          onChange={onChange}
          placeholder="Separate keydwords with `,`. Regular expression supported as `/search1|search2/`. `AND` condition supported with regular express as `/a/&&/b/`."
          value={searchKeywords}
        />
      </div>
    </div>
  );
}

export default App;
