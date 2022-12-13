import { observer } from 'mobx-react-lite';
import React from 'react';

import { Field } from './common/form';
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
        <Field
          className="log-filter"
          label="Search"
          value={file.filter.searchKeywords}
          onChange={(e: React.ChangeEvent) =>
            file.filter.setSearchKeywords((e.target as HTMLInputElement).value)
          }
          placeholder="Input search pattern"
        ></Field>
        <Field
          className="log-filter"
          label="Highlights"
          value={file.filter.hightlightText}
          onChange={(e: React.ChangeEvent) =>
            file.filter.setHightlightText((e.target as HTMLInputElement).value)
          }
          placeholder="Separate with `,`"
        ></Field>
      </div>
    </div>
  );
});
LogFileHeader.displayName = 'LogFileHeader';
