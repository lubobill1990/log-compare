import { faLocationPin } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { observer } from 'mobx-react-lite';
import {
  MouseEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  FixedSizeList,
  FixedSizeList as List,
  ListOnScrollProps,
} from 'react-window';

import { cx } from './components/common/cx';
import { ContextMenuTrigger } from './components/widget/context-menu';
import { LogLine } from './interface';
import { LogFile } from './mobx/log-file';
import { useSharedStateStore } from './mobx/shared-state';
import { ContextMenuKey } from './mobx/ui-store';
import { useResizeObserver } from './resize-observer';

interface IRowProps {
  index: number;
  style: any;
  data: {
    file: LogFile;
  };
}

const LogLineGetter = observer(
  (props: {
    file: LogFile;
    index: number;
    children: (line: LogLine, isPinedLine: boolean) => React.ReactNode;
  }) => {
    const { index, file, children } = props;
    const line = file.filteredLines[index];
    const isPinedLine = line && file.pinedLines.has(line.lineNumber);
    useEffect(() => {
      file.fetchFilteredLine(index);
    }, [index, file.fetchFilteredLine]);

    return <>{line && children(line, isPinedLine)}</>;
  }
);

const LogLineContainer = observer((props: IRowProps) => {
  const {
    index,
    style,
    data: { file },
  } = props;

  const [hovered, setHovered] = useState(false);

  const sharedStateStore = useSharedStateStore();
  const localTargetIndex = file.filteredLineIndexOfSelectedTimestamp;

  return (
    <LogLineGetter file={file} index={index}>
      {(line: LogLine, isPinedLine: boolean) => (
        <div
          className={[
            'line',
            index % 2 ? 'odd' : 'even',
            localTargetIndex === index ? 'target' : '',
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
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div
            className="line-head"
            onClick={(e) => {
              e.stopPropagation();
              file.addExpandedLineRange(
                line.lineNumber - 1,
                line.lineNumber - 1
              );
            }}
            title={new Date(line.timestamp).toLocaleString()}
          >
            {line.lineNumber + 1}
            <div className="line-mark">
              {(isPinedLine || hovered) && (
                <FontAwesomeIcon
                  icon={faLocationPin}
                  className={cx('pin', isPinedLine && 'pinned')}
                  onClick={(e: MouseEvent) => {
                    if (isPinedLine) {
                      file.unpinLine(line.lineNumber);
                    } else {
                      file.pinLine(line.lineNumber);
                    }
                    e.stopPropagation();
                  }}
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
      )}
    </LogLineGetter>
  );
});

const NoLogLineHint = observer((props: { file: LogFile }) => {
  const { file } = props;
  return (
    <div className="no-log-hint">
      <div className="content">
        {file.filtering ? (
          <p>Filtering...</p>
        ) : (
          <p>No line filtered. Please revisit the search patterns:</p>
        )}
        <ul>
          {file.filterStrings.map((keyword, i) => (
            <li key={i}>{keyword}</li>
          ))}
        </ul>
      </div>
    </div>
  );
});

const AutoSizedList = observer(
  (props: { file: LogFile; height: number; width: number }) => {
    const { file, height, width } = props;

    const listRef = useRef<FixedSizeList>(null);
    const listInnerRef = useRef<HTMLDivElement>(null);
    const listOuterRef = useRef<HTMLDivElement>(null);

    const localTargetIndex = file.filteredLineIndexOfSelectedTimestamp;

    useLayoutEffect(() => {
      if (listRef.current) {
        listRef.current.scrollToItem(localTargetIndex, 'smart');
      }
    }, [localTargetIndex]);

    const onScroll = useCallback((_props: ListOnScrollProps) => {}, []);
    return (
      <>
        {file.filteredLinesLength === 0 ? (
          <NoLogLineHint file={file}></NoLogLineHint>
        ) : (
          <List
            ref={listRef}
            outerRef={listOuterRef}
            innerRef={listInnerRef}
            className="List"
            itemCount={file.filteredLinesLength}
            itemSize={15}
            itemData={{
              file,
            }}
            height={height}
            width={width}
            onScroll={onScroll}
          >
            {LogLineContainer}
          </List>
        )}
      </>
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
