'use client';

import { makeAutoObservable } from 'mobx';
import { createContext, useContext } from 'react';

import { FileSystemDirectory } from '@/components/file-system/file-system-directory';
import { Nullable } from '@/interfaces/common';

export class ApiClientStore {
  rootDirectory: Nullable<FileSystemDirectory> = null;

  constructor() {
    makeAutoObservable(this);
  }

  setClient(directory: FileSystemDirectory) {
    this.rootDirectory = directory;
  }
}

export const apiClientStore = new ApiClientStore();
const context = createContext(apiClientStore);

export function useApiClientStore() {
  return useContext(context);
}
