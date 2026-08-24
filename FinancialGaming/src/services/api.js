import { API_BASE_URL } from "../config/api";

const SERVER_UNAVAILABLE =
  "Cannot reach the game server. It may be starting up — wait a moment and try again.";

const SERVER_BUSY =
  "Game server is temporarily unavailable. Please wait and retry.";

const ROOM_GONE =
  "This game room no longer exists. It may have finished or expired.";

const toFriendlyError = (path, status, message) => {
  if (status === 404 && path.startsWith("/api/lobby")) {
    return ROOM_GONE;
  }
  if (status === 502 || status === 503 || status === 504) {
    return SERVER_BUSY;
  }
  return message;
};

const request = async (path, options = {}) => {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
      ...options,
    });
  } catch {
    throw new Error(SERVER_UNAVAILABLE);
  }

  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = await response.json();
      message = body.detail ?? body.title ?? body.message ?? message;
    } catch {
      // ignore parse errors
    }
    throw new Error(toFriendlyError(path, response.status, message));
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  return response.json();
};

export const createLobby = (hostName) =>
  request("/api/lobby", {
    method: "POST",
    body: JSON.stringify({ hostName }),
  });

export const joinLobby = (roomCode, playerName) =>
  request("/api/lobby/join", {
    method: "POST",
    body: JSON.stringify({ roomCode, playerName }),
  });

export const spectateLobby = (roomCode, spectatorName) =>
  request("/api/lobby/spectate", {
    method: "POST",
    body: JSON.stringify({ roomCode, spectatorName }),
  });

export const fetchRoomByCode = (roomCode) =>
  request(`/api/lobby/room/${encodeURIComponent(roomCode)}`);

export const fetchLobby = (gameId) => request(`/api/lobby/${gameId}`);

export const fillBots = (gameId) =>
  request(`/api/lobby/${gameId}/fill-bots`, { method: "POST" });

export const readyAll = (gameId) =>
  request(`/api/lobby/${gameId}/ready-all`, { method: "POST" });

export const startGameApi = (gameId, playerId, sessionToken) =>
  request(`/api/lobby/${gameId}/start`, {
    method: "POST",
    body: JSON.stringify({ playerId, sessionToken }),
  });

export const rejoinLobby = (gameId, sessionToken) =>
  request(`/api/lobby/${gameId}/rejoin`, {
    method: "POST",
    body: JSON.stringify({ sessionToken }),
  });

export const setReadyApi = (gameId, playerId, sessionToken) =>
  postGameAction({
    gameId,
    playerId,
    action: "SET_READY",
    sessionToken,
  });

export const leaveLobbyApi = (gameId, playerId, sessionToken) =>
  request(`/api/lobby/${gameId}/leave`, {
    method: "POST",
    body: JSON.stringify({ playerId, sessionToken }),
  });

export const removePlayerApi = (gameId, hostPlayerId, sessionToken, targetPlayerId) =>
  request(`/api/lobby/${gameId}/remove-player`, {
    method: "POST",
    body: JSON.stringify({ hostPlayerId, sessionToken, targetPlayerId }),
  });

export const postGameAction = (action) =>
  request("/api/game/action", {
    method: "POST",
    body: JSON.stringify(action),
  });
