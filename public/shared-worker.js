const ports = [];

const sharedMessages = {};

onconnect = function (e) {
  var port = e.ports[0];
  ports.push(port);

  port.addEventListener("message", function (e) {
    const { type, sync } = e.data;
    if (type) {
      if (sync) {
        sharedMessages[type] = e.data;
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
