import { observer } from 'mobx-react-lite';

import { FilePicker } from '@/components/widget/file-picker';
import { useCreateLogFiles } from '@/file-dropzone';

export const DropzoneHint = observer(() => {
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
