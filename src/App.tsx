import { observer } from 'mobx-react-lite';
import ReactModal from 'react-modal';

import { GlobalFilterRenderer } from '@/components/filter';

import classes from './app.module.scss';
import './app.scss';
import { ContextMenus } from './components/widget/context-menu';
import { FilePicker } from './components/widget/file-picker';
import { useCreateLogFiles } from './file-dropzone';
import { FileExplorerRegister } from './file-explorer';
import { AppLayout, LayoutSlot } from './layout';
import { LogFileBody } from './log-file-body';
import { LogFileHeader } from './log-file-header';
import { SlotName } from './mobx/layout-store';
import { LogFile, useLogFliesStore } from './mobx/log-file';
import { SearchPanelRegister } from './search-panel';

ReactModal.setAppElement('#root');

const LogFileRenderer = observer(({ file }: { file: LogFile }) => {
  return (
    <div className={classes.logFile}>
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
          multiple={true}
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

const LogPanel = observer(() => {
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

const App = observer(() => {
  return (
    <>
      <LayoutSlot slotId={SlotName.searchBar}>
        <GlobalFilterRenderer></GlobalFilterRenderer>
      </LayoutSlot>
      <LayoutSlot slotId={SlotName.logPanel}>
        <LogPanel></LogPanel>
      </LayoutSlot>
      <FileExplorerRegister></FileExplorerRegister>
      <SearchPanelRegister></SearchPanelRegister>
      <AppLayout></AppLayout>
      <ContextMenus></ContextMenus>
    </>
  );
});

App.displayName = 'App2';

export default App;
