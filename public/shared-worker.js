const ports = [];
let db;
const sharedMessages = {};
function storeSharedMessages(message) {
  const { type } = message;

  if (db) {
    var transaction = db.transaction(["states"], "readwrite");
    var objectStore = transaction.objectStore("states");
    objectStore.put(message);
  }
  sharedMessages[type] = message;
}

const request = indexedDB.open("stateDb", 1);

request.onerror = function (event) {
  console.error("An error occurred with IndexedDB");
  console.error(event);
};

request.onupgradeneeded = function () {
  const db = request.result;
  db.createObjectStore("states", { keyPath: "type" });
};

request.onsuccess = function () {
  db = request.result;
  var transaction = db.transaction(["states"], "readwrite");
  var objectStore = transaction.objectStore("states");
  objectStore.getAll().onsuccess = (event) => {
    event.target.result.forEach((record) => {
      sharedMessages[record.type] = record;
    });
    ports.forEach((port) => {
      Object.values(sharedMessages).forEach((message) => {
        port.postMessage(message);
      });
    });
  };
};

onconnect = function (e) {
  var port = e.ports[0];
  ports.push(port);

  port.addEventListener("message", function (e) {
    const { type, sync } = e.data;
    if (type) {
      if (sync) {
        storeSharedMessages(e.data);
        ports.forEach((p) => {
          if (p !== port) {
            p.postMessage(e.data);
          }
        });
      } else if (type === "fetch") {
        Object.values(sharedMessages).forEach((message) => {
          port.postMessage(message);
        });
      }
    }
  });

  port.start(); // Required when using addEventListener. Otherwise called implicitly by onmessage setter.
};
