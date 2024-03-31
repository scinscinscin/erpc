import WebSocket from "ws";

const ws = new WebSocket("ws://localhost:2000/gateway", {});
ws.on("open", () => {
  console.log("Client has connected with server");

  ws.send(
    JSON.stringify({
      eventName: "send_message",
      data: { contents: "Hello World!" },
    })
  );

  ws.on("message", (data) => {
    console.log(data.toString());
  });
});
