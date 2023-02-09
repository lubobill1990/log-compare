import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';

import { cx } from '@/components/common/cx';
import { FileSystemDirectory } from '@/components/file-system/file-system-directory';
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
  SideBarBody,
  SideBarGeneratorSlot,
  SideBarTitle,
} from '@/layout';

import classes from './file-explorer.module.scss';
import { SideBarSection } from './section';

const EntryName = 'file-explorer';

export const Entry = observer(() => {
  return (
    <ActivityBarEntry id={EntryName}>
      <Files></Files>
    </ActivityBarEntry>
  );
});

export const DirectoryItem = observer(
  (props: { item: FileSystemDirectory; showTitle?: boolean }) => {
    const { item, showTitle = true } = props;
    const [open, setOpen] = useState(false);
    const [list, setList] = useState<FileSystemItem[]>([]);

    useEffect(() => {
      if (!showTitle) {
        setOpen(true);
      }
    }, [showTitle, setOpen]);

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
        {showTitle && (
          <div className={classes.title} onClick={() => setOpen(!open)}>
            <Caret
              direction={open ? 'down' : 'right'}
              className={classes.caret}
            ></Caret>
            {item.name}
          </div>
        )}
        {open && (
          <div className={cx(classes.subItems, classes.noTitleDirectoryItem)}>
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

const Workspace = observer(() => {
  const fileSystemStore = useFileSystemStore();
  return (
    <>
      {fileSystemStore.workspaceDirectory && (
        <SideBarSection title={fileSystemStore.workspaceDirectory?.name}>
          <DirectoryItem
            showTitle={false}
            item={fileSystemStore.workspaceDirectory}
          ></DirectoryItem>
        </SideBarSection>
      )}
    </>
  );
});

const ListItem = observer(
  (props: { item: FileSystemDirectory; id: string }) => {
    const fileSystemStore = useFileSystemStore();

    const { item, id } = props;

    return (
      <div
        className={classes.listItem}
        onClick={() => {
          fileSystemStore.setWorkspaceDirectory(item);
        }}
      >
        <div className={cx(classes.title, classes.itemTitle)}>{item.name}</div>
        <a
          href="#"
          className={classes.delete}
          onClick={(e) => {
            fileSystemStore.deleteHistoryDirectory(id);
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          X
        </a>
      </div>
    );
  }
);

export const OpenNewWorkspace = observer(() => {
  const fileSystemStore = useFileSystemStore();

  return (
    <>
      <SideBarSection title="Open new workspace">
        <div className={classes.buttonWrap}>
          <PrimaryButton
            onClick={async () => {
              const handle = await window.showDirectoryPicker();
              fileSystemStore.setWorkspaceDirectory(
                new FileSystemDirectory(handle)
              );
            }}
          >
            Open a directory
          </PrimaryButton>
        </div>
      </SideBarSection>
    </>
  );
});
export const HistoryDirectoryList = observer(() => {
  const fileSystemStore = useFileSystemStore();
  useEffect(() => {
    fileSystemStore.loadHistoryDirectories();
  }, []);

  return (
    <>
      <SideBarSection title="History directories">
        {fileSystemStore.historyDirectoryList.map(([key, val]) => {
          return <ListItem key={key} item={val} id={key}></ListItem>;
        })}
      </SideBarSection>
    </>
  );
});

export const SideBarContent = observer(() => {
  return (
    <>
      <SideBarTitle title="Explorer"></SideBarTitle>
      <SideBarBody>
        <Workspace></Workspace>
        <OpenNewWorkspace></OpenNewWorkspace>
        <HistoryDirectoryList></HistoryDirectoryList>
      </SideBarBody>
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
