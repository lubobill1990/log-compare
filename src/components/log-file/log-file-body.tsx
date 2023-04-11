import { observer } from 'mobx-react-lite';
import { useCallback, useLayoutEffect, useRef } from 'react';
import {
  FixedSizeList,
  FixedSizeList as List,
  ListOnScrollProps,
} from 'react-window';

import { cx } from '@/components/common/cx';
import { LogFile, LogFile1 } from '@/mobx/log-file';
import { useResizeObserver } from '@/resize-observer';

import classes from './log-file.module.scss';
import { LogLineContainer } from './log-line';

const NoLogLineHint = observer((props: { file: LogFile }) => {
  const { file } = props;
  return (
    <div className="no-log-hint">
      <div className="content">
        {file.isFiltering ? (
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

    const paddingWidth = 0;
    const onItemsRendered = useCallback(() => {
      if (listOuterRef.current && listInnerRef.current) {
        if (
          listOuterRef.current.scrollWidth - listInnerRef.current.clientWidth >
          paddingWidth + 4
        ) {
          listInnerRef.current.style.width = `${
            listOuterRef.current.scrollWidth - paddingWidth
          }px`;
        }
      }
    }, [listOuterRef, paddingWidth, listInnerRef]);

    const localTargetIndex = file.filteredLineIndexOfSelectedTimestamp;

    useLayoutEffect(() => {
      if (listRef.current) {
        listRef.current.scrollToItem(localTargetIndex, 'smart');
      }
    }, [localTargetIndex]);

    const onScroll = useCallback((_props: ListOnScrollProps) => {}, []);
    return (
      <>
        {file.filteredLineCount === 0 ? (
          <NoLogLineHint file={file}></NoLogLineHint>
        ) : (
          <List
            ref={listRef}
            outerRef={listOuterRef}
            innerRef={listInnerRef}
            className="List"
            itemCount={file.filteredLineCount}
            itemSize={15}
            itemData={{
              file,
            }}
            height={height}
            width={width}
            onScroll={onScroll}
            onItemsRendered={onItemsRendered}
          >
            {LogLineContainer}
          </List>
        )}
      </>
    );
  }
);

const AllLinesSection = observer((props: { file: LogFile }) => {
  const { file } = props;

  const sectionRef = useRef<HTMLDivElement>(null);
  const { width, height } = useResizeObserver(sectionRef);
  return (
    <div className={classes.allLines} ref={sectionRef}>
      <AutoSizedList height={height} width={width} file={file}></AutoSizedList>
    </div>
  );
});

const FilteredLinesSection = observer((props: { file: LogFile }) => {
  const { file } = props;

  const sectionRef = useRef<HTMLDivElement>(null);
  const { width, height } = useResizeObserver(sectionRef);
  return (
    <div className={classes.filteredLines} ref={sectionRef}>
      <AutoSizedList height={height} width={width} file={file}></AutoSizedList>
    </div>
  );
});

export const LogFileBody = observer((props: { file: LogFile1 }) => {
  const { file } = props;
  return (
    <div className={cx(classes.body, 'lines')} onWheel={() => {}}>
      <AllLinesSection file={file.nonFilteredFile}></AllLinesSection>
      {file.filteredFile.filterStrings.length > 0 && (
        <FilteredLinesSection file={file.filteredFile}></FilteredLinesSection>
      )}
    </div>
  );
});
