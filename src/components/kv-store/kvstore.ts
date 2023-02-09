import { IDBPDatabase, openDB } from 'idb';

let dbPromise: Promise<IDBPDatabase<unknown>>;

function initOrGetDb() {
  if (!dbPromise) {
    dbPromise = openDB('keyval-store', 1, {
      upgrade(db) {
        db.createObjectStore('keyval');
      },
    });
  }

  return dbPromise;
}

export async function get(key: string) {
  return (await initOrGetDb()).get('keyval', key);
}
export async function set(key: string, val: any) {
  return (await initOrGetDb()).put('keyval', val, key);
}
export async function del(key: string) {
  return (await initOrGetDb()).delete('keyval', key);
}
export async function clear() {
  return (await initOrGetDb()).clear('keyval');
}
export async function keys() {
  return (await initOrGetDb()).getAllKeys('keyval');
}
export async function all() {
  return (await initOrGetDb()).getAll('keyval');
}
export async function allWithKeys() {
  const db = await initOrGetDb();
  let cursor = await db.transaction('keyval').store.openCursor();

  const result = new Map();
  while (cursor) {
    result.set(cursor.key, cursor.value);
    cursor = await cursor.continue();
  }

  return result;
}
