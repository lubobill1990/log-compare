import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

import { PrimaryButton, SecondaryButton } from '@/components/widget/button';
import { Modal, ModalSize } from '@/components/widget/modal/index';

import { useFileSystemStore } from './file-system-store';
import classes from './picker.module.scss';

export const FileSystemDirectoryHandlePicker = observer(() => {
  const fileSystemStore = useFileSystemStore();

  useEffect(() => {
    fileSystemStore.retrieveDirectoryHandle();
  }, [fileSystemStore]);

  return (
    <>
      <Modal
        title="Setup a workspace"
        isOpen={fileSystemStore.isDirectoryHandlePickerModalVisible}
        onClose={() => fileSystemStore.setForceHideAllDialogs(true)}
        size={ModalSize.Medium}
      >
        <div className="mt-8 mb-4">
          <div
            className={classes.operationWrap}
            onClick={fileSystemStore.openFilePicker}
          >
            <h2>Open a local directory</h2>
            <p>Joint supports local workspace, for free, permanently. </p>
            <p>
              You can open an existing directory or create a new one on your
              device, a directory is also known simply as a folder. Your data
              will be stored only on this device.
            </p>
            <p>
              After you have opened your directory, it will create three folders
              in that directory:
            </p>
            <ul>
              <li>/projects - store project files</li>
              <li>/journals - store your journal pages</li>
              <li>
                /logseq - store configuration, custom.css, and some metadata.
              </li>
            </ul>
          </div>
          {fileSystemStore.directoryHandle && (
            <div className="mt-4">
              Or{' '}
              <SecondaryButton
                className="mx-4"
                onClick={() => fileSystemStore.grantPermission()}
              >
                grant permission
              </SecondaryButton>{' '}
              on <b>{fileSystemStore.directoryHandle.name}</b>
            </div>
          )}
        </div>
      </Modal>
      {fileSystemStore.directoryHandle && (
        <Modal
          title="Grant workspace directory permission"
          isOpen={fileSystemStore.isGrantPermissionDialogVisible}
          onClose={() => fileSystemStore.setForceHideAllDialogs(true)}
          size={ModalSize.Small}
        >
          <p>
            Are you sure to grant permission on{' '}
            <b>{fileSystemStore.directoryHandle.name}</b>, or setup a new
            workspace?
          </p>
          <div className="mt-4">
            <PrimaryButton
              className="mr-4"
              onClick={() => fileSystemStore.grantPermission()}
            >
              Grant
            </PrimaryButton>

            <SecondaryButton
              onClick={fileSystemStore.hideGrantPermissionDialog}
            >
              Setup new workspace
            </SecondaryButton>
          </div>
        </Modal>
      )}
    </>
  );
});

FileSystemDirectoryHandlePicker.displayName = 'FileSystemDirectoryHandlePicker';
