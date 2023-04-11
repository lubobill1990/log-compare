import { observer } from 'mobx-react-lite';
import { Fragment } from 'react';

import { LogFileRenderer } from '@/components/log-file/log-file-renderer';
import { useLogFliesStore } from '@/mobx/log-file';

import { LogFileResizeHandle } from '../log-file/log-file-resize-handle';
import { DropzoneHint } from './dropzone-hint';

export const LogPanel = observer(() => {
  const logFileStore = useLogFliesStore();

  return (
    <>
      {logFileStore.size === 0 && <DropzoneHint></DropzoneHint>}
      {logFileStore.files.map((logFile, i) => (
        <Fragment key={logFile.id}>
          {i > 0 && <LogFileResizeHandle index={i}></LogFileResizeHandle>}
          <LogFileRenderer file={logFile}></LogFileRenderer>
        </Fragment>
      ))}
    </>
  );
});
