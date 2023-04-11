import { observer } from 'mobx-react-lite';

import { LogFile1 } from '@/mobx/log-file';
import { useUIStore } from '@/mobx/ui-store';

import { LogFileBody } from './log-file-body';
import { LogFileHeader } from './log-file-header';
import classes from './log-file.module.scss';

export const LogFileRenderer = observer(({ file }: { file: LogFile1 }) => {
  const { logPanelWidth } = useUIStore();

  return (
    <div
      className={classes.root}
      style={{ width: `${logPanelWidth * file.widthProportion}px` }}
    >
      <LogFileHeader file={file}></LogFileHeader>
      <LogFileBody file={file}></LogFileBody>
    </div>
  );
});
