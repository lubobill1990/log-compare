import { observer } from 'mobx-react-lite';

import { LogFileRenderer } from '@/components/log-file/log-file-renderer';
import { useLogFliesStore } from '@/mobx/log-file';

import { DropzoneHint } from './dropzone-hint';

export const LogPanel = observer(() => {
  const logFileStore = useLogFliesStore();

  return (
    <>
      {logFileStore.size === 0 && <DropzoneHint></DropzoneHint>}
      {logFileStore.files.map((logFile) => (
        <LogFileRenderer key={logFile.id} file={logFile}></LogFileRenderer>
      ))}
    </>
  );
});
