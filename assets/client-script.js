/* eslint-disable */
document.addEventListener("DOMContentLoaded", () => {
  console.log("Client script loaded");
  // Same host and port the page was loaded from, so a port mapping (Docker, a reverse proxy)
  // between the browser and the server needs no configuration.
  const scheme = location.protocol === "https:" ? "wss" : "ws";
  const socket = new WebSocket(`${scheme}://${location.host}`);
  socket.addEventListener("open", () => {
    console.log("Connected to server");
  });

  socket.addEventListener("message", (event) => {
    console.log("Message from server:", event.data);
    if (event.data === "reload") {
      console.log("Reloading page");
      window.location.reload();
    }
  });
});
/* eslint-enable */
