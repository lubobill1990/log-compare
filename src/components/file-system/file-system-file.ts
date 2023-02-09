import { Nullable } from '@/interfaces/common';

import { FileSystemItem } from './file-system-item';

export class FileSystemFile extends FileSystemItem {
  constructor(handle: FileSystemFileHandle) {
    super(handle);
    console.log('FileSystemFile', handle);
  }

  get fileHandle(): FileSystemFileHandle {
    return this.handle as FileSystemFileHandle;
  }

  async getFile(): Promise<File> {
    return this.fileHandle.getFile();
  }

  async createWritable(): Promise<FileSystemWritableFileStream> {
    return this.fileHandle.createWritable();
  }

  async getText(): Promise<string> {
    const file = await this.getFile();
    return file.text();
  }

  async getJson<T>(): Promise<Nullable<T>> {
    const text = await this.getText();
    return JSON.parse(text) as T;
  }

  async writeJson(data: unknown): Promise<void> {
    await this.write(JSON.stringify(data, null, 3));
  }

  async write(file: FileSystemWriteChunkType): Promise<void> {
    const writable = await this.createWritable();
    if (writable === null) {
      return;
    }
    await writable.write(file);
    await writable.close();
  }
}
