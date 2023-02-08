import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';

import { FileSystemDirectory } from '@/components/file-system/file-system-directory';
import { FileSystemDirectoryHandlePicker } from '@/components/file-system/file-system-directory-handle-picker';
import { FileSystemFile } from '@/components/file-system/file-system-file';
import { FileSystemItem } from '@/components/file-system/file-system-item';
import { useFileSystemStore } from '@/components/file-system/file-system-store';
import { PrimaryButton } from '@/components/widget/button';
import { useCreateLogFiles } from '@/file-dropzone';
import { Caret } from '@/icons/caret';
import { Files } from '@/icons/files';
import {
  ActivityBarEntry,
  ActivityBarSlot,
  SideBarGeneratorSlot,
  SideBarTitle,
} from '@/layout';

import classes from './file-explorer.module.scss';

const EntryName = 'file-explorer';

export const Entry = observer(() => {
  return (
    <ActivityBarEntry id={EntryName}>
      <Files></Files>
    </ActivityBarEntry>
  );
});

export const DirectoryItem = observer(
  (props: { item: FileSystemDirectory }) => {
    const { item } = props;
    const [open, setOpen] = useState(false);
    const [list, setList] = useState<FileSystemItem[]>([]);

    useEffect(() => {
      if (open) {
        item.list().then((res) => {
          console.log('res', res);
          if (res) {
            setList(res);
          }
        });
      } else {
        setList([]);
      }
    }, [setList, item, open]);

    return (
      <div className={classes.directory}>
        <div className={classes.title} onClick={() => setOpen(!open)}>
          <Caret
            direction={open ? 'down' : 'right'}
            className={classes.caret}
          ></Caret>
          {item.name}
        </div>
        {open && (
          <div className={classes.subItems}>
            {list.map((v) => (
              // eslint-disable-next-line @typescript-eslint/no-use-before-define
              <FileOrDirectoryItem key={v.name} item={v}></FileOrDirectoryItem>
            ))}
          </div>
        )}
      </div>
    );
  }
);
export const FileItem = observer((props: { item: FileSystemFile }) => {
  const { item } = props;
  const createLogFiles = useCreateLogFiles();

  return (
    <div className={classes.file}>
      <div
        className={classes.title}
        onClick={async () => {
          const file = await item.getFile();
          if (file) {
            createLogFiles([file]);
          }
        }}
      >
        {item.name}
      </div>
    </div>
  );
});

// eslint-disable-next-line @typescript-eslint/no-use-before-define
export const FileOrDirectoryItem = observer(
  (props: { item: FileSystemItem }) => {
    return (
      <>
        {props.item.kind === 'directory' ? (
          <DirectoryItem
            item={props.item as FileSystemDirectory}
          ></DirectoryItem>
        ) : (
          <FileItem item={props.item as FileSystemFile}></FileItem>
        )}
      </>
    );
  }
);

export const SideBarContent = observer(() => {
  const fileSystemStore = useFileSystemStore();

  const [pickerOpened, setOpenPicker] = useState(false);

  return (
    <>
      <div className={classes.root}>
        <SideBarTitle title="Explorer"></SideBarTitle>
        {pickerOpened && (
          <FileSystemDirectoryHandlePicker></FileSystemDirectoryHandlePicker>
        )}
        {!fileSystemStore.verifiedDirectory && (
          <div className={classes.buttonWrap}>
            <PrimaryButton
              onClick={() => {
                setOpenPicker(true);
                fileSystemStore.setForceHideAllDialogs(false);
              }}
            >
              Open a directory
            </PrimaryButton>
          </div>
        )}
        {fileSystemStore.verifiedDirectory && (
          <DirectoryItem
            item={fileSystemStore.verifiedDirectory}
          ></DirectoryItem>
        )}
      </div>
    </>
  );
});

export const FileExplorerRegister = observer(() => {
  return (
    <>
      <ActivityBarSlot slotId={EntryName}>
        <Entry></Entry>
      </ActivityBarSlot>

      <SideBarGeneratorSlot slotId={EntryName}>
        {() => (
          <>
            <SideBarContent></SideBarContent>
          </>
        )}
      </SideBarGeneratorSlot>
    </>
  );
});
