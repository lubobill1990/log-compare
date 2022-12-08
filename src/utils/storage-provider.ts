export class StorageProvider {
  constructor(protected storageKey: string) {}

  private getKey(key?: string) {
    return key ? `${this.storageKey}_${key}` : this.storageKey;
  }

  load<T>(defaultValue: T, key?: string) {
    const data = localStorage.getItem(this.getKey(key));
    if (data) {
      return JSON.parse(data) as T;
    }
    return defaultValue;
  }

  save(data: any, key?: string) {
    localStorage.setItem(this.getKey(key), JSON.stringify(data));
  }
}
