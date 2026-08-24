const STORAGE_KEY = "finance-frenzy-session";

/** @typedef {{ gameId: string, playerId: string, sessionToken: string, roomCode?: string, isHost?: boolean, playerName?: string, role?: 'PLAYER' | 'SPECTATOR' }} GameSession */

/** @returns {GameSession | null} */
export const loadGameSession = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

/** @param {Partial<GameSession> | null} patch */
export const saveGameSession = (patch) => {
  if (!patch) {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
  const current = loadGameSession() ?? {};
  const next = { ...current, ...patch };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
};

export const clearGameSession = () => {
  sessionStorage.removeItem(STORAGE_KEY);
};

/** Merge router state with persisted session (survives refresh). */
export const resolveSession = (locationState = {}) => {
  // Explicit host/join/spectate navigation must not inherit a stale game from storage
  if (
    locationState.mode === "host" ||
    locationState.mode === "join" ||
    locationState.mode === "spectate"
  ) {
    return { ...locationState };
  }

  const stored = loadGameSession();
  const merged = {
    ...stored,
    ...locationState,
  };
  if (merged.gameId && merged.playerId && merged.sessionToken) {
    saveGameSession(merged);
  }
  return merged;
};

export const buildJoinUrl = (roomCode) => {
  const base = window.location.origin;
  return `${base}/join?code=${encodeURIComponent(roomCode ?? "")}`;
};

export const buildWatchUrl = (roomCode) => {
  const base = window.location.origin;
  return `${base}/watch?code=${encodeURIComponent(roomCode ?? "")}`;
};

export const isSpectatorSession = (session) =>
  session?.role === "SPECTATOR" || String(session?.playerId ?? "").startsWith("spectator-");
