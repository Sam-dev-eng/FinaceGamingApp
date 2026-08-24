import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  createLobby,
  joinLobby,
  spectateLobby,
  fillBots,
  readyAll,
  fetchLobby,
  startGameApi,
  setReadyApi,
  rejoinLobby,
  leaveLobbyApi,
  removePlayerApi,
} from "../services/api";
import { connectGameSocket, releaseGameSocket } from "../services/Websocket";
import { normalizeGameState } from "../services/gameStateAdapter";
import {
  loadGameSession,
  saveGameSession,
  resolveSession,
  clearGameSession,
} from "../shared/session/gameSessionStorage";

const normalizeLobbyPlayer = (player) => ({
  ...player,
  status: player.status ?? "WAITING",
  bot: player.bot ?? false,
});

const pushActivity = (setActivity, text) => {
  setActivity((prev) => [
    { id: `${Date.now()}-${Math.random()}`, text, at: Date.now() },
    ...prev.slice(0, 7),
  ]);
};

const diffLobbyActivity = (prevPlayers, nextPlayers, setActivity) => {
  const prevById = new Map(prevPlayers.map((p) => [p.id, p]));
  const nextById = new Map(nextPlayers.map((p) => [p.id, p]));

  for (const player of nextPlayers) {
    if (player.bot) continue;
    const before = prevById.get(player.id);
    if (!before) {
      pushActivity(setActivity, `${player.name} joined the lobby`);
      continue;
    }
    if (before.status !== "READY" && player.status === "READY") {
      pushActivity(setActivity, `${player.name} is ready`);
    }
  }

  for (const player of prevPlayers) {
    if (player.bot) continue;
    if (!nextById.has(player.id)) {
      pushActivity(setActivity, `${player.name} left the lobby`);
    }
  }
};

const isLobbyStage = (stage) => !stage || stage === "LOBBY" || stage === "lobby";

const isPlayerInLobby = (players, playerId) =>
  Boolean(playerId && (players ?? []).some((player) => player.id === playerId));

const isSpectatorInLobby = (spectators, spectatorId) =>
  Boolean(spectatorId && (spectators ?? []).some((spectator) => spectator.id === spectatorId));

export const useLobbySession = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initial = resolveSession(location.state ?? {});

  const [gameId, setGameId] = useState(initial.gameId ?? null);
  const [playerId, setPlayerId] = useState(initial.playerId ?? null);
  const [sessionToken, setSessionToken] = useState(initial.sessionToken ?? null);
  const [roomCode, setRoomCode] = useState(initial.roomCode ?? null);
  const [players, setPlayers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [isHost, setIsHost] = useState(Boolean(initial.isHost));
  const [isSpectator, setIsSpectator] = useState(initial.role === "SPECTATOR");
  const [spectators, setSpectators] = useState([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const roomCodeRef = useRef(roomCode);
  const isHostRef = useRef(isHost);
  const sessionTokenRef = useRef(sessionToken);
  const playersRef = useRef([]);
  const playerIdRef = useRef(playerId);
  const gameIdRef = useRef(gameId);
  const initRequestRef = useRef(0);
  const isSpectatorRef = useRef(isSpectator);
  const ejectedRef = useRef(false);

  roomCodeRef.current = roomCode;
  isHostRef.current = isHost;
  sessionTokenRef.current = sessionToken;
  playerIdRef.current = playerId;
  gameIdRef.current = gameId;
  isSpectatorRef.current = isSpectator;

  const handleRemovedFromLobby = useCallback(
    (message = "You were removed from the lobby by the host.") => {
      if (ejectedRef.current) return;
      ejectedRef.current = true;
      clearGameSession();
      navigate("/", { replace: true, state: { notice: message } });
    },
    [navigate]
  );

  const canFollowGameStart = useCallback((players, spectators) => {
    const memberId = playerIdRef.current;
    if (!memberId) return false;
    if (isSpectatorRef.current) {
      return isSpectatorInLobby(spectators, memberId);
    }
    return isPlayerInLobby(players, memberId);
  }, []);

  const persistSession = useCallback((patch) => {
    const saved = saveGameSession(patch);
    if (saved?.sessionToken) setSessionToken(saved.sessionToken);
    return saved;
  }, []);

  const navigateToCaseStudy = useCallback(
    (roleOverride) => {
      const role =
        roleOverride ?? (isSpectator ? "SPECTATOR" : "PLAYER");
      const session = {
        gameId: gameIdRef.current,
        playerId: playerIdRef.current,
        sessionToken: sessionTokenRef.current,
        roomCode: roomCodeRef.current,
        isHost: isHostRef.current,
        role,
      };
      persistSession(session);
      navigate("/case-study", { state: session, replace: true });
    },
    [navigate, persistSession, isSpectator]
  );

  const updatePlayers = useCallback((nextPlayers, { announce = true } = {}) => {
    const normalized = (nextPlayers ?? []).map(normalizeLobbyPlayer);
    if (announce) {
      diffLobbyActivity(playersRef.current, normalized, setActivity);
    }
    playersRef.current = normalized;
    setPlayers(normalized);
  }, []);

  const applyLobby = useCallback(
    (lobby, resolvedPlayerId, { announce = false } = {}) => {
      if (ejectedRef.current) return false;

      const pid = resolvedPlayerId ?? lobby.playerId ?? playerIdRef.current;
      const stage = lobby.state?.gameStage;
      const spectators = lobby.spectators ?? lobby.state?.spectators ?? [];
      const role = lobby.role ?? (initial.role === "SPECTATOR" ? "SPECTATOR" : "PLAYER");
      const spectatorRole = role === "SPECTATOR" || isSpectatorRef.current;

      if (pid && isLobbyStage(stage)) {
        const stillMember = spectatorRole
          ? isSpectatorInLobby(spectators, pid)
          : isPlayerInLobby(lobby.players, pid);
        if (!stillMember) {
          handleRemovedFromLobby();
          return false;
        }
      }

      setGameId(lobby.gameId);
      setRoomCode(lobby.roomCode);
      setSpectators(spectators);
      updatePlayers(lobby.players ?? [], { announce });
      if (pid) setPlayerId(pid);
      if (lobby.sessionToken) setSessionToken(lobby.sessionToken);

      setIsSpectator(spectatorRole);

      const me = (lobby.players ?? []).find((p) => p.id === pid);
      if (me) setIsHost(me.host);

      const savedName =
        me?.name ??
        initial.playerName ??
        loadGameSession()?.playerName;

      persistSession({
        gameId: lobby.gameId,
        roomCode: lobby.roomCode,
        playerId: pid,
        sessionToken: lobby.sessionToken ?? sessionTokenRef.current,
        isHost: me?.host ?? isHostRef.current,
        playerName: savedName,
        role: spectatorRole ? "SPECTATOR" : "PLAYER",
      });
      return true;
    },
    [persistSession, updatePlayers, initial.role, initial.playerName, handleRemovedFromLobby]
  );

  const syncLobbyFromServer = useCallback(
    async ({ announce = true } = {}) => {
      const id = gameIdRef.current;
      const pid = playerIdRef.current;
      if (!id || ejectedRef.current) return;
      try {
        const lobby = await fetchLobby(id);
        if (!applyLobby(lobby, pid, { announce })) return;

        const stage = lobby.state?.gameStage;
        if (stage && !isLobbyStage(stage)) {
          if (canFollowGameStart(lobby.players, lobby.spectators ?? lobby.state?.spectators)) {
            navigateToCaseStudy(isSpectatorRef.current ? "SPECTATOR" : "PLAYER");
          } else {
            handleRemovedFromLobby("The game started without you.");
          }
        }
      } catch {
        // ignore transient fetch errors
      }
    },
    [applyLobby, navigateToCaseStudy, canFollowGameStart, handleRemovedFromLobby]
  );

  useEffect(() => {
    let cancelled = false;
    const requestId = ++initRequestRef.current;

    const shouldApply = () => !cancelled && requestId === initRequestRef.current;

    const refreshSession = async (room, name, storedPlayerId) => {
      const id = gameIdRef.current ?? loadGameSession()?.gameId;
      if (id && storedPlayerId) {
        const currentLobby = await fetchLobby(id);
        if (!isPlayerInLobby(currentLobby.players, storedPlayerId)) {
          handleRemovedFromLobby();
          return null;
        }
      }

      const lobby = await joinLobby(room, name);
      if (!shouldApply()) return null;
      if (!applyLobby(lobby, lobby.playerId)) return null;
      return lobby;
    };

    const init = async () => {
      try {
        if (initial.mode === "host") {
          if (!initial.playerName?.trim()) {
            navigate("/host", { replace: true });
            return;
          }
          clearGameSession();
          const lobby = await createLobby(initial.playerName.trim());
          if (!shouldApply()) return;
          applyLobby(lobby, lobby.playerId);
          setIsHost(true);
          setLoading(false);
          return;
        }

        if (initial.mode === "join" && initial.roomCode && initial.playerName) {
          const lobby = await joinLobby(initial.roomCode, initial.playerName);
          if (!shouldApply()) return;
          applyLobby(lobby, lobby.playerId);
          setLoading(false);
          return;
        }

        if (initial.mode === "spectate" && initial.roomCode && initial.playerName) {
          clearGameSession();
          const lobby = await spectateLobby(initial.roomCode, initial.playerName);
          if (!shouldApply()) return;
          applyLobby(lobby, lobby.playerId);
          setIsSpectator(true);
          setLoading(false);
          const stage = lobby.state?.gameStage;
          if (stage && stage !== "LOBBY" && stage !== "lobby") {
            navigateToCaseStudy("SPECTATOR");
          }
          return;
        }

        const stored = loadGameSession();
        if (stored?.gameId && stored?.sessionToken) {
          try {
            const lobby = await rejoinLobby(stored.gameId, stored.sessionToken);
            if (!shouldApply()) return;
            applyLobby(lobby, lobby.playerId);
            setIsSpectator(stored.role === "SPECTATOR" || lobby.role === "SPECTATOR");
            setLoading(false);
            const stage = lobby.state?.gameStage;
            if (
              (stored.role === "SPECTATOR" || lobby.role === "SPECTATOR") &&
              stage &&
              stage !== "LOBBY" &&
              stage !== "lobby"
            ) {
              navigateToCaseStudy("SPECTATOR");
            }
            return;
          } catch {
            if (
              stored.roomCode &&
              stored.playerName &&
              stored.role !== "SPECTATOR" &&
              shouldApply()
            ) {
              try {
                const lobby = await refreshSession(
                  stored.roomCode,
                  stored.playerName,
                  stored.playerId
                );
                if (!lobby) return;
                setLoading(false);
                return;
              } catch {
                clearGameSession();
              }
            } else {
              clearGameSession();
            }
          }
        }

        if (initial.gameId && initial.playerId) {
          try {
            const lobby = await fetchLobby(initial.gameId);
            if (!shouldApply()) return;
            applyLobby(lobby, initial.playerId);
            setLoading(false);
            return;
          } catch {
            clearGameSession();
          }
        }

        navigate("/host", { replace: true });
      } catch (err) {
        if (shouldApply()) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [applyLobby, initial.mode, initial.roomCode, initial.playerName, initial.gameId, initial.playerId, initial.role, navigate, navigateToCaseStudy, handleRemovedFromLobby]);

  useEffect(() => {
    if (!gameId || !playerId || loading) return;

    const handleMessage = (message) => {
      if (message.type === "PLAYER_REMOVED") {
        const removedId = message.payload?.playerId;
        if (removedId && removedId === playerIdRef.current) {
          handleRemovedFromLobby("You were removed from the lobby by the host.");
        }
        return;
      }

      if (message.type === "LOBBY_UPDATED") {
        const payload = message.payload ?? {};
        const pid = playerIdRef.current;
        const spectators = payload.spectators ?? [];
        const players = payload.players ?? [];

        if (pid && isLobbyStage(payload.gameStage)) {
          const stillMember = isSpectatorRef.current
            ? isSpectatorInLobby(spectators, pid)
            : isPlayerInLobby(players, pid);
          if (!stillMember) {
            handleRemovedFromLobby();
            return;
          }
        }

        updatePlayers(players, { announce: true });
        if (payload.roomCode) setRoomCode(payload.roomCode);
        if (payload.spectators) setSpectators(spectators);

        if (payload.gameStage && !isLobbyStage(payload.gameStage)) {
          if (canFollowGameStart(players, spectators)) {
            navigateToCaseStudy(isSpectatorRef.current ? "SPECTATOR" : "PLAYER");
          } else {
            handleRemovedFromLobby("The game started without you.");
          }
        }
        return;
      }

      if (message.type === "GAME_STATE") {
        const state = normalizeGameState(message.payload, playerIdRef.current);
        updatePlayers(state?.players ?? [], { announce: false });
        return;
      }

      if (message.type === "GAME_STARTED") {
        const state = normalizeGameState(message.payload, playerIdRef.current);
        if (!canFollowGameStart(state?.players, state?.spectators)) {
          handleRemovedFromLobby("The game started without you.");
          return;
        }
        updatePlayers(state?.players ?? [], { announce: false });
        navigateToCaseStudy(isSpectatorRef.current ? "SPECTATOR" : "PLAYER");
        return;
      }

      if (message.type === "ERROR") {
        setError(typeof message.payload === "string" ? message.payload : "Action failed");
      }
    };

    const onConnected = () => {
      setConnected(true);
      syncLobbyFromServer({ announce: true });
    };
    const onDisconnected = () => setConnected(false);

    connectGameSocket(gameId, handleMessage, { onConnected, onDisconnected }).catch((err) =>
      setError(err.message)
    );

    return () => {
      releaseGameSocket(handleMessage, { onConnected, onDisconnected });
    };
  }, [gameId, playerId, loading, navigateToCaseStudy, syncLobbyFromServer, updatePlayers, handleRemovedFromLobby, canFollowGameStart]);

  // If the tab was in the background, browsers may pause WebSocket delivery.
  // One REST sync when the user returns — not a page refresh, not constant polling.
  useEffect(() => {
    if (!gameId || loading) return;

    const syncOnVisible = () => {
      if (document.visibilityState === "visible") {
        syncLobbyFromServer({ announce: true });
      }
    };

    window.addEventListener("focus", syncOnVisible);
    document.addEventListener("visibilitychange", syncOnVisible);

    return () => {
      window.removeEventListener("focus", syncOnVisible);
      document.removeEventListener("visibilitychange", syncOnVisible);
    };
  }, [gameId, loading, syncLobbyFromServer]);

  const handleFillBots = async () => {
    if (!gameId) return;
    try {
      const lobby = await fillBots(gameId);
      applyLobby(lobby, playerId, { announce: true });
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReadyAll = async () => {
    if (!gameId) return;
    try {
      const lobby = await readyAll(gameId);
      applyLobby(lobby, playerId, { announce: true });
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const recoverSession = useCallback(async () => {
    if (ejectedRef.current) return false;

    const stored = loadGameSession();
    const room = roomCodeRef.current ?? stored?.roomCode;
    const pid = playerIdRef.current ?? stored?.playerId;
    const name =
      stored?.playerName ??
      playersRef.current.find((p) => p.id === pid)?.name;
    if (!room || !name || isSpectatorRef.current) return false;

    const id = gameIdRef.current ?? stored?.gameId;
    if (id && pid) {
      try {
        const lobby = await fetchLobby(id);
        if (!isPlayerInLobby(lobby.players, pid)) {
          handleRemovedFromLobby();
          return false;
        }
      } catch {
        return false;
      }
    }

    try {
      const lobby = await joinLobby(room, name);
      if (!applyLobby(lobby, lobby.playerId, { announce: false })) return false;
      return true;
    } catch {
      return false;
    }
  }, [applyLobby, handleRemovedFromLobby]);

  const handleReadySelf = async () => {
    if (!gameId || !playerId) return;
    let token = sessionTokenRef.current;
    if (!token) {
      const recovered = await recoverSession();
      if (!recovered) {
        setError("Session expired — rejoin the lobby with the same name and room code.");
        return;
      }
      token = sessionTokenRef.current;
    }
    try {
      updatePlayers(
        playersRef.current.map((p) =>
          p.id === playerId ? { ...p, status: "READY" } : p
        ),
        { announce: false }
      );
      await setReadyApi(gameId, playerId, token);
      setError(null);
    } catch (err) {
      if (/session token|invalid/i.test(err.message ?? "")) {
        const recovered = await recoverSession();
        if (recovered && sessionTokenRef.current) {
          try {
            await setReadyApi(gameId, playerIdRef.current, sessionTokenRef.current);
            setError(null);
            return;
          } catch (retryErr) {
            setError(retryErr.message);
          }
        } else {
          setError(err.message);
        }
      } else {
        setError(err.message);
      }
      try {
        const lobby = await fetchLobby(gameId);
        applyLobby(lobby, playerId, { announce: false });
      } catch {
        // ignore
      }
    }
  };

  const handleStartGame = async () => {
    if (!gameId || !playerId) return;
    if (!sessionTokenRef.current) {
      const recovered = await recoverSession();
      if (!recovered) {
        setError("Session expired — rejoin the lobby with the same name and room code.");
        return;
      }
    }
    try {
      await startGameApi(gameId, playerId, sessionTokenRef.current);
      setError(null);
      navigateToCaseStudy(isHost ? "PLAYER" : "PLAYER");
    } catch (err) {
      if (/session token|invalid/i.test(err.message ?? "")) {
        const recovered = await recoverSession();
        if (recovered) {
          try {
            await startGameApi(gameId, playerIdRef.current, sessionTokenRef.current);
            setError(null);
            navigateToCaseStudy("PLAYER");
            return;
          } catch (retryErr) {
            setError(retryErr.message);
          }
        } else {
          setError(err.message);
        }
      } else {
        setError(err.message);
      }
    }
  };

  const handleExitLobby = useCallback(async () => {
    const id = gameIdRef.current;
    const pid = playerIdRef.current;
    const token = sessionTokenRef.current;

    if (id && pid && token) {
      try {
        await leaveLobbyApi(id, pid, token);
      } catch {
        // Leave locally even if the server call fails (e.g. lobby already gone).
      }
    }

    clearGameSession();
    navigate("/", { replace: true });
  }, [navigate]);

  const handleRemovePlayer = useCallback(
    async (targetPlayerId) => {
      if (!gameId || !playerId || !isHostRef.current || !targetPlayerId) return;
      if (targetPlayerId === playerId) return;

      const target = playersRef.current.find((p) => p.id === targetPlayerId);
      if (!target) return;

      const confirmed = window.confirm(`Remove ${target.name} from the lobby?`);
      if (!confirmed) return;

      let token = sessionTokenRef.current;
      if (!token) {
        const recovered = await recoverSession();
        if (!recovered) {
          setError("Session expired — rejoin the lobby to manage players.");
          return;
        }
        token = sessionTokenRef.current;
      }

      try {
        const lobby = await removePlayerApi(gameId, playerId, token, targetPlayerId);
        applyLobby(lobby, playerId, { announce: true });
        setError(null);
      } catch (err) {
        if (/session token|invalid/i.test(err.message ?? "")) {
          const recovered = await recoverSession();
          if (recovered && sessionTokenRef.current) {
            try {
              const lobby = await removePlayerApi(
                gameId,
                playerIdRef.current,
                sessionTokenRef.current,
                targetPlayerId
              );
              applyLobby(lobby, playerIdRef.current, { announce: true });
              setError(null);
              return;
            } catch (retryErr) {
              setError(retryErr.message);
            }
          } else {
            setError(err.message);
          }
        } else {
          setError(err.message);
        }
      }
    },
    [applyLobby, gameId, playerId, recoverSession]
  );

  const myPlayer = players.find((p) => p.id === playerId);
  const amReady = myPlayer?.status === "READY";

  const slots = Array.from({ length: 3 }, (_, index) => {
    const player = players[index];
    if (!player) {
      return { isEmpty: true, key: `empty-${index}` };
    }
    return {
      key: player.id,
      playerId: player.id,
      name: player.name,
      status: player.status ?? "WAITING",
      isHost: player.host,
      isBot: player.bot ?? false,
      isEmpty: false,
    };
  });

  const isFull = players.length >= 3;
  const hasBots = players.some((p) => p.bot);
  const humanCount = players.filter((p) => !p.bot).length;
  const allReady = isFull && players.every((p) => p.status === "READY");

  return {
    roomCode,
    gameId,
    playerId,
    sessionToken,
    isHost,
    isSpectator,
    spectators,
    connected,
    loading,
    error,
    activity,
    slots,
    isFull,
    hasBots,
    humanCount,
    allReady,
    amReady,
    handleFillBots,
    handleReadyAll,
    handleReadySelf,
    handleStartGame,
    handleExitLobby,
    handleRemovePlayer,
  };
};
