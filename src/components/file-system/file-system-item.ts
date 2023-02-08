export class FileSystemItem {
  constructor(private handleItem: FileSystemHandle) {}

  get name(): string {
    return this.handleItem.name;
  }

  get kind(): string {
    return this.handleItem.kind;
  }

  isSameItem(other: FileSystemItem): Promise<boolean> {
    return this.handleItem.isSameEntry(other.handleItem);
  }
}
