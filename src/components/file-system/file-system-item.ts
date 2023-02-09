export class FileSystemItem {
  constructor(protected handle: FileSystemHandle) {}

  get name(): string {
    return this.handle.name;
  }

  get kind(): string {
    return this.handle.kind;
  }

  isSameItem(other: FileSystemItem): Promise<boolean> {
    return this.handle.isSameEntry(other.handle);
  }

  async verifyPermission(withWrite: boolean) {
    const opts: FileSystemHandlePermissionDescriptor = {};
    if (withWrite) {
      opts.mode = 'readwrite';
    } else {
      opts.mode = 'read';
    }

    // Check if we already have permission, if so, return true.
    if ((await this.handle.queryPermission(opts)) === 'granted') {
      return true;
    }

    // Request permission to the file, if the user grants permission, return true.
    if ((await this.handle.requestPermission(opts)) === 'granted') {
      return true;
    }

    // The user did not grant permission, return false.
    return false;
  }
}
