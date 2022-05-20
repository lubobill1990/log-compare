const ports = [];

onconnect = function (e) {
  var port = e.ports[0];
  ports.push(port);

  port.addEventListener("message", function (e) {
    ports.forEach((p) => {
      if (p !== port) {
        p.postMessage(e.data);
      }
    });
  });

  port.start(); // Required when using addEventListener. Otherwise called implicitly by onmessage setter.
};
