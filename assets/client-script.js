/* eslint-disable */
document.addEventListener("DOMContentLoaded", () => {
  console.log("Client script loaded");
  const socket = new WebSocket("ws://localhost:$$__PORT__$$");
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