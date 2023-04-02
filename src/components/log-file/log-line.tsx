import { faLocationPin } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { cx } from '@/components/common/cx';
import { ContextMenuTrigger } from '@/components/widget/context-menu';
import { LogLine } from '@/interface';
import { LogFile } from '@/mobx/log-file';
import { useSharedStateStore } from '@/mobx/shared-state';
import { ContextMenuKey } from '@/mobx/ui-store';

import { LogLineGetter } from './log-line-getter';

interface IRowProps {
  index: number;
  style: any;
  data: {
    file: LogFile;
  };
}

export const LogLineContainer = observer((props: IRowProps) => {
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
            if (file.enableSyncTime) {
              sharedStateStore.setFocusTimestamp(line.timestamp);
            }
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
                  onClick={(e: React.MouseEvent) => {
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
