import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

let stompClient = null;

export const connectWebSocket = (gameId, onMessageReceived) => {
  const socket = new SockJS("http://localhost:8080/ws");

  stompClient = new Client({
    webSocketFactory: () => socket,
    debug: () => {},
    reconnectDelay: 5000,
    onConnect: () => {
      console.log("Connected to WebSocket");

      stompClient.subscribe(`/topic/game/${gameId}`, (message) => {
        const body = JSON.parse(message.body);
        onMessageReceived(body);
      });
    },
  });

  stompClient.activate();
};

export const sendAction = (action) => {
  if (stompClient && stompClient.connected) {
    stompClient.publish({
      destination: "/app/game.action",
      body: JSON.stringify(action),
    });
  }
};