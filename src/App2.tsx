import './App.css';
import React, { useCallback, useRef } from 'react';
import { DropTargetMonitor, useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
import {
  Filter,
  LogFile,
  LogFileNameStore,
  LogFiles,
  StoredFilters,
} from './mobx';
import { observer } from 'mobx-react-lite';
import {
  FixedSizeList,
  FixedSizeList as List,
  ListOnItemsRenderedProps,
} from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { cx } from '@/common/cx';

const logFiles = new LogFiles();
const logFileNameStore = new LogFileNameStore();
const globalFilter = new Filter();
const storedFilters = new StoredFilters();

const StoredFiltersSelector = observer(() => {
  return (
    <select
      className={cx('123')}
      onChange={(e) => {
        const filter = storedFilters.storedFilters[parseInt(e.target.value)];
        if (filter) {
          globalFilter.hightlightText = filter.hightlightText;
          globalFilter.searchKeywords = filter.searchKeywords;
        }
      }}
    >
      <option value="">Stored filters</option>
      {storedFilters.storedFilters.map((filter, index) => (
        <option value={index} key={index}>
          {filter.name ||
            `Search: ${filter.searchKeywords} - Highlight: ${filter.hightlightText}`}
        </option>
      ))}
    </select>
  );
});

export function useFileDropzone() {
  const [, dropRef] = useDrop(
    () => ({
      accept: [NativeTypes.FILE, NativeTypes.URL],
      drop(item, _monitor) {
        const files = (item as any).files as File[];
        if (files) {
          files.forEach((file) => {
            const reader = new FileReader();
            // dropRef.current.getBoundingClientRect()
            reader.onabort = () => console.log('file reading was aborted');
            reader.onerror = () => console.log('file reading has failed');
            reader.onload = () => {
              if (reader.result) {
                logFiles.add(
                  new LogFile(
                    logFileNameStore,
                    logFiles,
                    globalFilter,
                    file.name,
                    reader.result as string
                  )
                );
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
    [logFiles]
  );
  return dropRef;
}

const LogFileHeader = observer((props: { file: LogFile }) => {
  const { file } = props;

  return (
    <div className="log-header">
      <div className="title">
        <input
          type="text"
          value={file.name}
          onChange={(e: React.ChangeEvent) => {
            file.name = (e.target as HTMLInputElement).value;
          }}
        />
      </div>
      <div className="log-filters">
        <div className="log-filter">
          <label htmlFor="">Search:</label>
          <input
            type="text"
            onChange={(e: React.ChangeEvent) => {
              file.filter.setSearchKeywords(
                (e.target as HTMLInputElement).value
              );
            }}
            placeholder="Separate with `,`"
            value={file.filter.searchKeywords}
          />
        </div>
        <div className="log-filter">
          <label htmlFor="">Highlights:</label>
          <input
            type="text"
            onChange={(e: React.ChangeEvent) => {
              file.filter.setHightlightText(
                (e.target as HTMLInputElement).value
              );
            }}
            placeholder="Separate with `,`"
            value={file.filter.hightlightText}
          />
        </div>
      </div>
      <div className="close" onClick={() => file.delete()}>
        ✕
      </div>
    </div>
  );
});
LogFileHeader.displayName = 'LogFileHeader';
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
  return (
    <div
      className={[
        'line',
        index % 2 ? 'odd' : 'even',

        line.lineNumber === 1 ? 'selected' : '',
      ].join(' ')}
      key={index}
      style={style}
      onClick={() => {}}
    >
      <div
        className="count"
        onClick={() =>
          file.expandedLineRanges.addRange(
            line.lineNumber - 1,
            line.lineNumber - 1
          )
        }
      >
        {line.lineNumber + 1}
      </div>
      <div
        className="content"
        dangerouslySetInnerHTML={{
          __html: file.highlightContent(line.content),
        }}
      ></div>
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

const LogFileBody = observer((props: { file: LogFile }) => {
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

const LogFileRenderer = observer(({ file }: { file: LogFile }) => {
  return (
    <div className="file-wrapper" onMouseEnter={() => file.focus()}>
      <LogFileHeader file={file}></LogFileHeader>
      <LogFileBody file={file}></LogFileBody>
    </div>
  );
});

const GlobalFilterRenderer = observer(() => {
  return (
    <div className="global-footer">
      <div className="stored-filters">
        <StoredFiltersSelector></StoredFiltersSelector>
      </div>
      <div className="keyword-filter">
        <label htmlFor="">Global search:</label>
        <input
          type="text"
          className="keywords"
          onChange={(e: React.ChangeEvent) =>
            globalFilter.setSearchKeywords((e.target as HTMLInputElement).value)
          }
          placeholder="Separate keydwords with `,`. Regular expression supported as `/search1|search2/`. `AND` condition supported with regular express as `/a/&&/b/`."
          value={globalFilter.searchKeywords}
        />
      </div>
      <div className="global-highlight-keywords">
        <label htmlFor="">Global highlights:</label>
        <input
          type="text"
          className="keywords"
          onChange={(e: React.ChangeEvent) =>
            globalFilter.setHightlightText((e.target as HTMLInputElement).value)
          }
          placeholder="Separate with `,`"
          value={globalFilter.hightlightText}
        />
      </div>
      <div>
        <button
          onClick={() => {
            storedFilters.saveFilter(globalFilter);
          }}
        >
          Save Filter
        </button>
      </div>
    </div>
  );
});
GlobalFilterRenderer.displayName = 'GlobalFilterRenderer';

const DropzoneHint = observer(() => {
  return (
    <div className="dropzone-hint">
      <div>Drop log files here</div>
      <div className="ensure-hint">
        To compare log files with timestamp locally, safely, and efficiently.
        <br />
        Multiple tabs comparing supported.
      </div>
    </div>
  );
});

const App2 = observer(() => {
  const dropRef = useFileDropzone();

  return (
    <div className="App" ref={dropRef}>
      <div className="vertical-compare-zone">
        {logFiles.size === 0 && <DropzoneHint></DropzoneHint>}
        {logFiles.files.map((logFile) => {
          return (
            <LogFileRenderer key={logFile.id} file={logFile}></LogFileRenderer>
          );
        })}
      </div>
      <GlobalFilterRenderer></GlobalFilterRenderer>
    </div>
  );
});

App2.displayName = 'App2';

export default App2;
