const allPorts: MessagePort[] = [];
let db: IDBDatabase | null = null;

export interface SharedState {
  searchKeywords: string | null;
  highlightText: string | null;
  focusTimestamp: number | null;
}

export type PostedData =
  | {
      type: 'fetch';
      payload: void;
    }
  | {
      type: 'send';
      payload: SharedState;
    };

const sharedState: SharedState = {
  searchKeywords: null,
  highlightText: null,
  focusTimestamp: null,
};

function storeSharedMessages(newState: SharedState) {
  if (db) {
    const transaction = db.transaction(['states'], 'readwrite');
    const objectStore = transaction.objectStore('states');
    Object.entries(newState).forEach(([key, value]) => {
      objectStore.put({ type: key, value });
    });

    transaction.commit();
  }
  sharedState.searchKeywords = newState.searchKeywords;
  sharedState.highlightText = newState.highlightText;
  sharedState.focusTimestamp = newState.focusTimestamp;
}

const request = indexedDB.open('stateDb', 1);

request.onerror = function (event) {
  console.error('An error occurred with IndexedDB');
  console.error(event);
};

request.onupgradeneeded = () => {
  const localDb = request.result;
  localDb.createObjectStore('states', { keyPath: 'type' });
};

request.onsuccess = () => {
  db = request.result;
  const transaction = db.transaction(['states'], 'readwrite');
  const objectStore = transaction.objectStore('states');
  objectStore.getAll().onsuccess = (event) => {
    (event.target as any)?.result.forEach((record: any) => {
      if (record.type === 'search') sharedState.searchKeywords = record.value;
      if (record.type === 'highlight') sharedState.highlightText = record.value;
      if (record.type === 'focusTimestamp')
        sharedState.focusTimestamp = record.focusTimestamp;
    });
    allPorts.forEach((port) => {
      port.postMessage(sharedState);
    });
  };
};

// eslint-disable-next-line no-restricted-globals
self.onconnect = ({ ports: [port] }) => {
  allPorts.push(port);

  port.addEventListener('message', (e) => {
    const eventData = e.data as PostedData;
    const { type } = eventData;
    if (type === 'send') {
      storeSharedMessages(eventData.payload);
      allPorts.forEach((p) => {
        if (p !== port) {
          p.postMessage(eventData);
        }
      });
    } else if (type === 'fetch') {
      port.postMessage({
        type: 'send',
        payload: sharedState,
      });
    }
  });

  port.start(); // Required when using addEventListener. Otherwise called implicitly by onmessage setter.
};
