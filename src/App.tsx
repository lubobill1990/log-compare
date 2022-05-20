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
type TargetTime = [number, number];

interface IRowProps {
  index: number;
  style: any;
  data: {
    lines: Line[];
    targetTime: TargetTime;
  };
}

const Row = (props: IRowProps) => {
  const {
    index,
    style,
    data: { lines, targetTime },
  } = props;
  const content = lines[index][0];
  const time = lines[index][1];
  const onClick = useCallback(() => {}, [time]);
  return (
    <div
      className={[
        "line",
        index % 2 ? "odd" : "even",
        targetTime[0] === time ? "target" : "",
        targetTime[1] === time ? "prev" : "",
      ].join(" ")}
      key={index}
      style={style}
      onClick={onClick}
    >
      <div className="count">{index}</div>
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

function LogFileContainer(props: { file: LogFile }) {
  const { file } = props;
  const {
    searchKeywords,
    scrollToTimestamp,
    setScrollToTimestamp,
    setActiveLogFileId,
    activeLogFileId,
  } = useLogContext();
  const [targetTime, setTargetTime] = useState<TargetTime>([0, 0]);
  const [filteredLines, setFilteredLines] = useState<Line[]>([]);

  useEffect(() => {
    if (searchKeywords.filter((v) => v).length === 0) {
      setFilteredLines(file.lines);
    } else {
      setFilteredLines(
        file.lines.filter((line) => {
          const lowerLine = line[0].toLowerCase();
          return searchKeywords.some(
            (keyword) => lowerLine.indexOf(keyword) >= 0
          );
        })
      );
    }
  }, [searchKeywords, setFilteredLines, file.lines]);

  const isOperatingOnThisFileLog = activeLogFileId === file.id;
  const onItemsRendered = useCallback(
    (e: ListOnItemsRenderedProps) => {
      const { visibleStartIndex, visibleStopIndex } = e;
      const scrollOffsetIndex =
        Math.floor(visibleStartIndex + visibleStopIndex) / 2;

      if (filteredLines[scrollOffsetIndex]) {
        setTargetTime((prev) => {
          const time = filteredLines[scrollOffsetIndex][1];
          return [time, time === prev[0] ? prev[1] : prev[0]];
        });
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
        setTargetTime((prev) => {
          const time = filteredLines[localTargetIndex][1];
          return [time, time === prev[0] ? prev[1] : prev[0]];
        });
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
  const { logFiles, setSearchKeywords } = useLogContext();
  const dropRef = useFileDropzone();

  const onChange = useCallback(
    (e: React.ChangeEvent) => {
      const value = (e.target as HTMLInputElement).value;
      setSearchKeywords(value.split(",").map((v) => v.trim()));
    },
    [setSearchKeywords]
  );
  return (
    <div className="App" ref={dropRef}>
      <div className="vertical-compare-zone">
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
          placeholder="separate keywords with `,`"
        />
      </div>
    </div>
  );
}

export default App;
