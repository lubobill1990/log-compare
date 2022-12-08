import { faLocationPin } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { observer } from 'mobx-react-lite';
import React, { useCallback, useRef } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import {
  FixedSizeList,
  FixedSizeList as List,
  ListOnItemsRenderedProps,
} from 'react-window';

import './App.css';
import { LogFile } from './mobx/log-file';
import { ContextMenuKey } from './mobx/ui-store';
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
    const listRef = useRef<FixedSizeList>(null);
    const onItemsRendered = useCallback((e: ListOnItemsRenderedProps) => {},
    []);
    return (
      <List
        ref={listRef}
        className="List"
        itemCount={file.filteredLines.length}
        itemSize={15}
        itemData={{
          file,
        }}
        height={height}
        width={width}
        onItemsRendered={onItemsRendered}
      >
        {LogLineRenderer}
      </List>
    );
  }
);

export const LogFileBody = observer((props: { file: LogFile }) => {
  const { file } = props;
  return (
    <div className="lines" onWheel={() => {}}>
      <AutoSizer>
        {({ height, width }: { height: number; width: number }) => (
          <AutoSizedList
            height={height}
            width={width}
            file={file}
          ></AutoSizedList>
        )}
      </AutoSizer>
    </div>
  );
});
