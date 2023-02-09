import { Nullable } from '@/interfaces/common';

import { FileSystemFile } from './file-system-file';
import { FileSystemItem } from './file-system-item';

export class FileSystemDirectory extends FileSystemItem {
  constructor(handle: FileSystemDirectoryHandle) {
    super(handle);
    console.log('FileSystemDirectory', handle.name);
  }

  get directoryHandle(): FileSystemDirectoryHandle {
    return this.handle as FileSystemDirectoryHandle;
  }

  async getDirectory(
    path: string,
    create = false
  ): Promise<Nullable<FileSystemDirectory>> {
    const parts = path.split('/').filter((part) => part !== '');

    try {
      const targetHandle = await parts.reduce(
        async (currentHandle: Promise<FileSystemDirectoryHandle>, part) => {
          return (await currentHandle).getDirectoryHandle(part, { create });
        },
        Promise.resolve(this.directoryHandle)
      );
      return new FileSystemDirectory(targetHandle);
    } catch (e) {
      return null;
    }
  }

  async getFile(
    path: string,
    create = false
  ): Promise<Nullable<FileSystemFile>> {
    const parts = path.split('/');
    const fileName = parts.pop();

    if (fileName === undefined) {
      return null;
    }

    const directory = await this.getDirectory(parts.join('/'), create);

    if (directory === null) {
      return null;
    }

    try {
      const fileHandle = await directory.directoryHandle.getFileHandle(
        fileName,
        {
          create,
        }
      );

      return new FileSystemFile(fileHandle);
    } catch (e) {
      return null;
    }
  }

  async list(
    filter?: (props: { name: string; type: 'directory' | 'file' }) => boolean
  ): Promise<FileSystemItem[]> {
    const result: FileSystemItem[] = [];
    // eslint-disable-next-line no-restricted-syntax
    for await (const [key, value] of this.directoryHandle.entries()) {
      if (filter === undefined || filter({ name: key, type: value.kind })) {
        if (value.kind === 'directory') {
          result.push(new FileSystemDirectory(value));
        } else {
          result.push(new FileSystemFile(value));
        }
      }
    }
    return result;
  }

  async fileExists(path: string): Promise<boolean> {
    return (await this.getFile(path)) !== null;
  }

  async directoryExists(path: string): Promise<boolean> {
    return (await this.getDirectory(path)) !== null;
  }

  async createDirectory(path: string): Promise<Nullable<FileSystemDirectory>> {
    return this.getDirectory(path, true);
  }

  async createFile(path: string): Promise<Nullable<FileSystemFile>> {
    return this.getFile(path, true);
  }
}
