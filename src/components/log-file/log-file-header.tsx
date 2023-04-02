import { observer } from 'mobx-react-lite';
import React, { ChangeEvent } from 'react';

import { DebouncedInputField } from '@/components/common/form';
import { ContextMenuTrigger } from '@/components/widget/context-menu';
import { LogFile1 } from '@/mobx/log-file';
import { ContextMenuKey, useUIStore } from '@/mobx/ui-store';

import classes from './log-file.module.scss';

export const LogFileHeader = observer((props: { file: LogFile1 }) => {
  const { file } = props;
  const { showContextMenu } = useUIStore();

  return (
    <div
      className={classes.header}
      onContextMenu={(e) =>
        showContextMenu(
          { x: e.clientX, y: e.clientY },
          ContextMenuKey.LogFileHeader
        )
      }
    >
      <div className="close" onClick={() => file.delete()}>
        ✕
      </div>
      <ContextMenuTrigger contextMenuKey={ContextMenuKey.LogFileHeader}>
        <div className="title">
          <input
            type="text"
            value={file.name}
            onChange={(e: React.ChangeEvent) => {
              file.name = (e.target as HTMLInputElement).value;
            }}
          />
        </div>
      </ContextMenuTrigger>

      <div className={classes.controlWrap}>
        <div className={classes.control} title="Sync time between logs">
          <label htmlFor={`${file.id}-sync`}>Sync time</label>
          <input
            id={`${file.id}-sync`}
            type="checkbox"
            checked={file.enableSyncTime}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              file.setEnableSyncTime(e.target.checked);
            }}
          />
        </div>
        <div className={classes.control}>
          <label htmlFor={`${file.id}-search`}>Search</label>
          <input
            id={`${file.id}-search`}
            type="checkbox"
            checked={file.filter.searchEnabled}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              file.filter.setEnableSearch(e.target.checked);
            }}
            title="Enable global search"
            className="check"
          />
          {file.filter.searchEnabled && (
            <div className={classes.positionWrap}>
              <div className="log-filters">
                <DebouncedInputField
                  className="log-filter"
                  label="Search"
                  value={file.filter.searchKeywords}
                  onChange={(value: string) =>
                    file.filter.setSearchKeywords(value)
                  }
                  placeholder="Input search pattern"
                ></DebouncedInputField>
                <DebouncedInputField
                  className="log-filter"
                  label="Highlights"
                  value={file.filter.highlightText}
                  onChange={(value) => file.filter.setHighlightText(value)}
                  placeholder="Separate with `,`"
                ></DebouncedInputField>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
LogFileHeader.displayName = 'LogFileHeader';
