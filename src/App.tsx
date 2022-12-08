import { observer } from 'mobx-react-lite';

import './app.css';
import { useCreateLogFiles, useFileDropzone } from './file-dropzone';
import { FilePicker } from './file-picker';
import { GlobalFilterRenderer } from './filter';
import { LogFileBody } from './log-file-body';
import { LogFileHeader } from './log-file-header';
import { LogFile, useLogFlieStore } from './mobx/log-file';
import { ContextMenus } from './widget/context-menu';

const LogFileRenderer = observer(({ file }: { file: LogFile }) => {
  return (
    <div className="file-wrapper" onMouseEnter={() => file.focus()}>
      <LogFileHeader file={file}></LogFileHeader>
      <LogFileBody file={file}></LogFileBody>
    </div>
  );
});

const DropzoneHint = observer(() => {
  const createLogFiles = useCreateLogFiles();
  return (
    <div className="dropzone-hint">
      <div>
        Drop log files here or{' '}
        <FilePicker
          onFilesPicked={(files) => {
            createLogFiles(files);
          }}
        >
          <a>load log file</a>
        </FilePicker>
      </div>
      <div className="ensure-hint">
        To compare log files with timestamp locally, safely, and efficiently.
        <br />
        Multiple tabs comparing supported.
      </div>
    </div>
  );
});

const App = observer(() => {
  const dropRef = useFileDropzone();
  const logFileStore = useLogFlieStore();

  return (
    <div className="App" ref={dropRef}>
      <div className="vertical-compare-zone">
        {logFileStore.size === 0 && <DropzoneHint></DropzoneHint>}
        {logFileStore.files.map((logFile) => (
          <LogFileRenderer key={logFile.id} file={logFile}></LogFileRenderer>
        ))}
      </div>
      <ContextMenus></ContextMenus>
      <GlobalFilterRenderer></GlobalFilterRenderer>
    </div>
  );
});

App.displayName = 'App2';

export default App;
