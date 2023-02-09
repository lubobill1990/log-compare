import { makeAutoObservable, runInAction } from 'mobx';
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

        Array.from(this.historyDirectoryMap.entries())
          .filter(([_key, value]) => {
            return this.workspaceDirectory?.isSameItem(value);
          })
          .forEach(([key]) => {
            this.deleteHistoryDirectory(key);
          });
        const newId = Date.now().toString();
        set(newId, this.workspaceDirectory?.directoryHandle);
        this.historyDirectoryMap.set(newId, this.workspaceDirectory);
      });
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
