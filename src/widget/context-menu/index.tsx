import { ControlledMenu, MenuItem, useMenuState } from '@szhsin/react-menu';

import { observer } from 'mobx-react-lite';
import React, { DOMAttributes, useEffect } from 'react';

import { LogLine } from '@/interface';
import { LogFile } from '@/mobx';
import { ContextMenuKey, useUIStore } from '@/mobx/ui-store';

import './index.scss';

const LogLineContextMenu = observer(() => {
  const { file, line } = useUIStore().contextMenuData as {
    file: LogFile;
    line: LogLine;
  };

  return (
    <div>
      {file.pinedLines.has(line.lineNumber) ? (
        <MenuItem onClick={() => file.unpinLine(line.lineNumber)}>
          Unpin
        </MenuItem>
      ) : (
        <MenuItem onClick={() => file.pinLine(line.lineNumber)}>Pin</MenuItem>
      )}
    </div>
  );
});

const LogFileHeaderContextMenu = observer(() => {
  return <div>LogFileHeaderContextMenu</div>;
});

const ContextMenuRenderer = observer(() => {
  const [menuProps, toggleMenu] = useMenuState();
  const { contextMenuAnchorPoint, hideContextMenu, contextMenuActiveKey } =
    useUIStore();
  useEffect(() => {
    if (contextMenuActiveKey) {
      toggleMenu(true);
    }
  }, [contextMenuActiveKey, toggleMenu]);
  return (
    <ControlledMenu
      {...menuProps}
      anchorPoint={contextMenuAnchorPoint}
      onClose={() => {
        toggleMenu(false);
        hideContextMenu();
      }}
    >
      {contextMenuActiveKey === ContextMenuKey.LogLine && (
        <LogLineContextMenu></LogLineContextMenu>
      )}
      {contextMenuActiveKey === ContextMenuKey.LogFileHeader && (
        <LogFileHeaderContextMenu></LogFileHeaderContextMenu>
      )}
    </ControlledMenu>
  );
});

export function ContextMenus() {
  return (
    <>
      <ContextMenuRenderer></ContextMenuRenderer>
    </>
  );
}

export const ContextMenuTrigger = observer(
  (
    props: React.PropsWithChildren<{
      contextMenuKey: ContextMenuKey;
      data?: any;
    }>
  ) => {
    const { contextMenuKey, data, children } = props;
    const { showContextMenu } = useUIStore();
    const boundChildren = React.Children.map(
      children as React.ReactElement<DOMAttributes<Element>>[],
      (child) => {
        const originalOnContextMenu = child.props.onContextMenu;
        return React.cloneElement(child, {
          onContextMenu(event: React.MouseEvent) {
            originalOnContextMenu?.apply(child, [event]);
            showContextMenu(
              { x: event.clientX, y: event.clientY },
              contextMenuKey,
              data
            );
            event.preventDefault();
            event.stopPropagation();
          },
        });
      }
    );

    return <>{boundChildren}</>;
  }
);

ContextMenuTrigger.displayName = 'ContextMenuTrigger';
