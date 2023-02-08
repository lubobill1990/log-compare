import { makeAutoObservable } from 'mobx';
import { createContext, useContext } from 'react';

import {
  ApiClientStore,
  apiClientStore as globalApiClientStore,
} from '@/components/api-client/api-client-store';
import { get, set } from '@/components/kv-store/kvstore';
import { Nullable } from '@/interfaces/common';

import { FileSystemDirectory } from './file-system-directory';

async function verifyPermission(
  fileHandle: FileSystemHandle,
  withWrite: boolean
) {
  const opts: FileSystemHandlePermissionDescriptor = {};
  if (withWrite) {
    opts.mode = 'readwrite';
  } else {
    opts.mode = 'read';
  }

  // Check if we already have permission, if so, return true.
  if ((await fileHandle.queryPermission(opts)) === 'granted') {
    return true;
  }

  // Request permission to the file, if the user grants permission, return true.
  if ((await fileHandle.requestPermission(opts)) === 'granted') {
    return true;
  }

  // The user did not grant permission, return false.
  return false;
}

export class FileSystemStore {
  isPermissionGranted = false;

  isPermissionVerified = false;

  isGrantPermissionDialogHidden = false;

  fileSystemHandleApiAvailable = false;

  forceHideAllDialogs = false;

  directoryHandle: Nullable<FileSystemDirectoryHandle> = null;

  constructor(private apiClientStore: ApiClientStore) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get isGrantPermissionDialogVisible() {
    return (
      !this.isPermissionGranted &&
      this.directoryHandle !== null &&
      !this.isGrantPermissionDialogHidden &&
      !this.forceHideAllDialogs
    );
  }

  get isDirectoryHandlePickerModalVisible() {
    return (
      !this.isGrantPermissionDialogVisible &&
      !this.isPermissionGranted &&
      !this.forceHideAllDialogs
    );
  }

  setForceHideAllDialogs(val: boolean) {
    this.forceHideAllDialogs = val;
  }

  hideGrantPermissionDialog() {
    this.isGrantPermissionDialogHidden = true;
  }

  showGrantPermissionDialog() {
    this.isGrantPermissionDialogHidden = false;
  }

  setDirectoryHandle(directoryHandle: Nullable<FileSystemDirectoryHandle>) {
    this.directoryHandle = directoryHandle;
  }

  grantPermission(withWrite = false) {
    if (this.directoryHandle === null) {
      return;
    }
    this.isPermissionGranted = true;
    verifyPermission(this.directoryHandle, withWrite).then((result) => {
      if (!result || this.directoryHandle === null) {
        alert('Permission denied');
      } else {
        this.setIsPermissionVerified(true);
      }
    });
  }

  setIsPermissionVerified(val: boolean) {
    this.isPermissionVerified = val;
  }

  async openFilePicker() {
    const handle = await window.showDirectoryPicker();
    if (handle) {
      this.setDirectoryHandle(handle);
      set('workspaceDirectoryHandle', handle);
      this.grantPermission();
    }
  }

  retrieveDirectoryHandle() {
    get('workspaceDirectoryHandle').then(
      (handle: FileSystemDirectoryHandle) => {
        if (handle) {
          this.setDirectoryHandle(handle);
        }
      }
    );
  }

  get verifiedDirectory() {
    if (this.isPermissionVerified && this.directoryHandle !== null) {
      return new FileSystemDirectory(this.directoryHandle);
    }
    return null;
  }
}

export const fileSystemStore = new FileSystemStore(globalApiClientStore);
const context = createContext(fileSystemStore);

export function useFileSystemStore() {
  return useContext(context);
}
