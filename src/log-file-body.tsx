import { faLocationPin } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  FixedSizeList,
  FixedSizeList as List,
  ListOnItemsRenderedProps,
  ListOnScrollProps,
} from 'react-window';

import { LogFile } from './mobx/log-file';
import { useSharedStateStore } from './mobx/shared-state';
import { ContextMenuKey } from './mobx/ui-store';
import { useResizeObserver } from './resize-observer';
import { ContextMenuTrigger } from './widget/context-menu';

interface IRowProps {
  index: number;
  style: any;
  data: {
    file: LogFile;
  };
}

const LogLineRenderer = observer((props: IRowProps) => {
  const {
    index,
    style,
    data: { file },
  } = props;

  const line = file.filteredLines[index];
  const isPinedLine = file.pinedLines.has(line.lineNumber);
  const sharedStateStore = useSharedStateStore();
  return (
    <div
      className={[
        'line',
        index % 2 ? 'odd' : 'even',
        file.pinedLines.has(line.lineNumber) ? 'pined' : '',
        file.selectedTimestamps[2] === line.timestamp ? 'prev-2' : '',
        file.selectedTimestamps[1] === line.timestamp ? 'prev-1' : '',
        file.selectedTimestamps[0] === line.timestamp ? 'target' : '',
        file.selectedLines[2] === line.lineNumber ? 'selected-2' : '',
        file.selectedLines[1] === line.lineNumber ? 'selected-1' : '',
        file.selectedLines[0] === line.lineNumber ? 'selected' : '',
      ].join(' ')}
      key={index}
      style={style}
      onClick={() => {
        file.selectLine(line.lineNumber);
        sharedStateStore.setFocusTimestamp(line.timestamp);
      }}
    >
      <div
        className="line-head"
        onClick={(e) => {
          e.stopPropagation();
          file.expandedLineRanges.addRange(
            line.lineNumber - 1,
            line.lineNumber - 1
          );
        }}
      >
        {line.lineNumber + 1}
        <div className="line-mark">
          {isPinedLine && (
            <FontAwesomeIcon
              icon={faLocationPin}
              className="pin"
            ></FontAwesomeIcon>
          )}
        </div>
      </div>
      <ContextMenuTrigger
        contextMenuKey={ContextMenuKey.LogLine}
        data={{
          file,
          line,
        }}
      >
        <div
          className="content"
          dangerouslySetInnerHTML={{
            __html: file.highlightContent(line.content),
          }}
        ></div>
      </ContextMenuTrigger>
    </div>
  );
});

const AutoSizedList = observer(
  (props: { file: LogFile; height: number; width: number }) => {
    const { file, height, width } = props;

    const sharedStateStore = useSharedStateStore();

    const listRef = useRef<FixedSizeList>(null);
    const listInnerRef = useRef<HTMLDivElement>(null);
    const listOuterRef = useRef<HTMLDivElement>(null);

    const scrollerWidth = 16;
    const onItemsRendered = useCallback(
      (e: ListOnItemsRenderedProps) => {
        if (listOuterRef.current && listInnerRef.current) {
          if (
            listOuterRef.current.scrollWidth -
              listInnerRef.current.clientWidth >
            scrollerWidth + 4
          ) {
            listInnerRef.current.style.width = `${
              listOuterRef.current.scrollWidth - scrollerWidth
            }px`;
          }
        }

        const { visibleStartIndex, visibleStopIndex } = e;
        const scrollOffsetIndex = Math.floor(
          (visibleStartIndex + visibleStopIndex) / 2
        );
        const { filteredLines } = file;
        const scrolledLine = filteredLines[scrollOffsetIndex];

        if (scrolledLine && file.isFocused) {
          sharedStateStore.setFocusTimestamp(scrolledLine.timestamp);
        }
      },
      [listOuterRef, scrollerWidth, listInnerRef, file, sharedStateStore]
    );

    const localTargetIndex = file.filteredLineNumberOfSelectedTimestamp;

    useEffect(() => {
      if (listRef.current) {
        listRef.current.scrollToItem(localTargetIndex, 'smart');
      }
    }, [localTargetIndex]);

    const onScroll = useCallback((_props: ListOnScrollProps) => {}, []);
    return (
      <List
        ref={listRef}
        outerRef={listOuterRef}
        innerRef={listInnerRef}
        className="List"
        itemCount={file.filteredLines.length}
        itemSize={15}
        itemData={{
          file,
        }}
        height={height}
        width={width}
        onItemsRendered={onItemsRendered}
        onScroll={onScroll}
      >
        {LogLineRenderer}
      </List>
    );
  }
);

export const LogFileBody = observer((props: { file: LogFile }) => {
  const { file } = props;
  const linesRef = useRef<HTMLDivElement>(null);
  const { width, height } = useResizeObserver(linesRef);
  return (
    <div
      className="lines"
      ref={linesRef}
      onWheel={() => {}}
      onMouseOver={() => file.focus()}
      onMouseLeave={() => file.unfocus()}
    >
      <AutoSizedList height={height} width={width} file={file}></AutoSizedList>
    </div>
  );
});
