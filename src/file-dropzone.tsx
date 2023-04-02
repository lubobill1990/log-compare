import { useCallback } from 'react';
import { DropTargetMonitor, useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';

import { useGlobalFilterStore } from './mobx/filter';
import {
  LogFile1,
  useLogFileNameStore,
  useLogFliesStore,
} from './mobx/log-file';

function useCreateLogFile() {
  const logFileStore = useLogFliesStore();
  const globalFilterStore = useGlobalFilterStore();
  const logFileNameStore = useLogFileNameStore();
  return useCallback(
    (name: string, content: string) => {
      logFileStore.add(
        new LogFile1(
          logFileNameStore,
          logFileStore,
          globalFilterStore,
          name,
          content
        )
      );
    },
    [logFileNameStore, logFileStore, globalFilterStore]
  );
}

export function useCreateLogFiles() {
  const createLogFile = useCreateLogFile();

  return useCallback(
    (files: File[]) => {
      files.forEach((file) => {
        const reader = new FileReader();
        // dropRef.current.getBoundingClientRect()
        reader.onabort = () => console.log('file reading was aborted');
        reader.onerror = () => console.log('file reading has failed');
        reader.onload = () => {
          if (reader.result) {
            createLogFile(file.name, reader.result as string);
          }
        };
        reader.readAsText(file);
      });
    },
    [createLogFile]
  );
}

export function useFileDropzone() {
  const createLogFiles = useCreateLogFiles();
  const [, dropRef] = useDrop(
    () => ({
      accept: [NativeTypes.FILE, NativeTypes.URL],
      drop(item, _monitor) {
        const files = (item as any).files as File[];
        if (files) {
          createLogFiles(files);
        }
      },
      hover(_item, _monitor) {},
      canDrop(_item: any) {
        return true;
      },
      collect: (monitor: DropTargetMonitor) => {
        return {
          isOver: monitor.isOver(),
          canDrop: monitor.canDrop(),
        };
      },
    }),
    [createLogFiles]
  );
  return dropRef;
}
