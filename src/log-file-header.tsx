import { observer } from 'mobx-react-lite';
import React from 'react';

import { DebouncedInputField } from './common/form';
import { LogFile } from './mobx/log-file';
import { ContextMenuKey, useUIStore } from './mobx/ui-store';
import { ContextMenuTrigger } from './widget/context-menu';

export const LogFileHeader = observer((props: { file: LogFile }) => {
  const { file } = props;
  const { showContextMenu } = useUIStore();

  return (
    <div
      className="log-header"
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

      <div className="log-filters">
        <DebouncedInputField
          className="log-filter"
          label="Search"
          value={file.filter.searchKeywords}
          onChange={(value: string) => file.filter.setSearchKeywords(value)}
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
  );
});
LogFileHeader.displayName = 'LogFileHeader';
