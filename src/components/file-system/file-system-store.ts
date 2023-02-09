import { action, makeAutoObservable, runInAction } from 'mobx';
import { createContext, useContext } from 'react';

import { allWithKeys, del, set } from '@/components/kv-store/kvstore';
import { Nullable } from '@/interfaces/common';

import { FileSystemDirectory } from './file-system-directory';

export class FileSystemStore {
  workspaceDirectory: Nullable<FileSystemDirectory> = null;

  historyDirectories: FileSystemDirectory[] = [];

  historyDirectoryMap = new Map<string, FileSystemDirectory>();

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  async setWorkspaceDirectory(
    directory: Nullable<FileSystemDirectory>,
    withWrite = false
  ) {
    if (directory === null) {
      runInAction(() => {
        this.workspaceDirectory = null;
      });
      return;
    }

    const result = await directory.verifyPermission(withWrite);
    if (result) {
      runInAction(() => {
        this.workspaceDirectory = directory;
      });

      (
        await Promise.all(
          Array.from(this.historyDirectoryMap.entries()).map(
            async ([key, value]) => ({
              key,
              same: await this.workspaceDirectory?.isSameItem(value),
            })
          )
        )
      )
        .filter(({ same }) => same)
        .forEach(
          action(({ key }) => {
            console.log(key);
            this.deleteHistoryDirectory(key);
          })
        );

      if (this.workspaceDirectory) {
        const newId = Date.now().toString();
        set(newId, this.workspaceDirectory?.directoryHandle);
        runInAction(() => {
          if (this.workspaceDirectory) {
            this.historyDirectoryMap.set(newId, this.workspaceDirectory);
          } else {
            this.historyDirectoryMap.delete(newId);
          }
        });
      }
    }
  }

  async loadHistoryDirectories() {
    const res = await allWithKeys();
    runInAction(() => {
      this.historyDirectoryMap = new Map(
        Array.from(res).map(([key, value]) => [
          key,
          new FileSystemDirectory(value as FileSystemDirectoryHandle),
        ])
      );
    });
  }

  deleteHistoryDirectory(key: string) {
    console.log('deleteHistoryDirectory', key);
    this.historyDirectoryMap.delete(key);
    del(key);
  }

  get historyDirectoryList() {
    return Array.from(this.historyDirectoryMap.entries());
  }
}

export const fileSystemStore = new FileSystemStore();
const context = createContext(fileSystemStore);

export function useFileSystemStore() {
  return useContext(context);
}
