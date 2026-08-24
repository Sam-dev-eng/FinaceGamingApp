import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { WS_URL } from "../config/api";

/** @type {Client | null} */
let stompClient = null;
/** @type {import("@stomp/stompjs").StompSubscription | null} */
let activeSubscription = null;
let activeGameId = null;
/** @type {Set<(message: { type: string, payload: unknown }) => void>} */
const messageHandlers = new Set();
/** @type {Set<() => void>} */
const connectedHandlers = new Set();
/** @type {Set<() => void>} */
const disconnectedHandlers = new Set();

const notifyHandlers = (message) => {
  messageHandlers.forEach((handler) => {
    try {
      handler(message);
    } catch (error) {
      console.error("Game socket handler failed", error);
    }
  });
};

const subscribeToGame = (gameId) => {
  if (!stompClient?.connected) return;

  activeSubscription?.unsubscribe();
  activeSubscription = stompClient.subscribe(`/topic/game/${gameId}`, (message) => {
    try {
      notifyHandlers(JSON.parse(message.body));
    } catch (error) {
      console.error("Failed to parse WebSocket message", error);
    }
  });
};

/**
 * Register a message listener. Returns unsubscribe function.
 * Multiple pages (lobby, case-study, game) can listen on the same connection.
 */
export const subscribeGameMessages = (handler) => {
  messageHandlers.add(handler);
  return () => messageHandlers.delete(handler);
};

/**
 * Real-time channel — server pushes LOBBY_UPDATED / GAME_STARTED / GAME_STATE.
 */
export const connectGameSocket = (gameId, onMessage, hooks = {}) => {
    if (onMessage) {
      messageHandlers.add(onMessage);
    }
  if (hooks.onConnected) connectedHandlers.add(hooks.onConnected);
  if (hooks.onDisconnected) disconnectedHandlers.add(hooks.onDisconnected);

  if (stompClient?.connected && activeGameId === gameId) {
    hooks.onConnected?.();
    return Promise.resolve(stompClient);
  }

  if (stompClient?.connected && activeGameId !== gameId) {
    disconnectGameSocket();
  }

  if (stompClient?.connected) {
    return Promise.resolve(stompClient);
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    const socket = new SockJS(WS_URL);

    stompClient = new Client({
      webSocketFactory: () => socket,
      debug: () => {},
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        activeGameId = gameId;
        subscribeToGame(gameId);
        connectedHandlers.forEach((handler) => handler());
        if (!settled) {
          settled = true;
          resolve(stompClient);
        }
      },
      onStompError: (frame) => {
        if (!settled) {
          settled = true;
          reject(new Error(
            frame.headers?.message ??
              "Live connection failed. The server may be starting — try again shortly."
          ));
        }
      },
      onWebSocketClose: () => {
        activeGameId = null;
        activeSubscription = null;
        disconnectedHandlers.forEach((handler) => handler());
      },
    });

    stompClient.activate();
  });
};

/** Remove listeners without tearing down an active connection (route changes). */
export const releaseGameSocket = (onMessage, hooks = {}) => {
  if (onMessage) messageHandlers.delete(onMessage);
  if (hooks.onConnected) connectedHandlers.delete(hooks.onConnected);
  if (hooks.onDisconnected) disconnectedHandlers.delete(hooks.onDisconnected);
};

export const disconnectGameSocket = () => {
  activeSubscription?.unsubscribe();
  activeSubscription = null;
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
  }
  activeGameId = null;
  messageHandlers.clear();
  connectedHandlers.clear();
  disconnectedHandlers.clear();
};

export const isGameSocketConnected = () => Boolean(stompClient?.connected);

export const getActiveGameSocketId = () => activeGameId;

export const sendGameAction = (action) => {
  if (!stompClient?.connected) {
    console.warn("WebSocket not connected — action not sent", action);
    return false;
  }

  stompClient.publish({
    destination: "/app/game.action",
    body: JSON.stringify(action),
  });
  return true;
};

/** @deprecated use connectGameSocket */
export const connectWebSocket = connectGameSocket;

/** @deprecated use sendGameAction */
export const sendAction = sendGameAction;
