import { useCallback, useEffect, useRef, useState } from "react";
import { fetchLobby, postGameAction, joinLobby } from "../services/api";
import { normalizeFinalResults, normalizeGameState } from "../services/gameStateAdapter";
import { connectGameSocket, releaseGameSocket } from "../services/Websocket";
import { loadGameSession, saveGameSession } from "../shared/session/gameSessionStorage";

const sanitizeNumber = (value) =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

export const useServerGame = (gameId, playerId, { readOnly = false } = {}) => {
  const [gameState, setGameState] = useState(null);
  const [finalResults, setFinalResults] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const playerIdRef = useRef(playerId);
  const enteredGameRef = useRef(false);

  useEffect(() => {
    playerIdRef.current = playerId;
  }, [playerId]);

  useEffect(() => {
    if (!gameId || !playerId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const bootstrap = async () => {
      try {
        const lobby = await fetchLobby(gameId);
        if (cancelled) return;
        setGameState(normalizeGameState(lobby.state, playerId));
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    bootstrap();

    const handleMessage = (message) => {
      const currentPlayerId = playerIdRef.current;

      switch (message.type) {
        case "GAME_STATE":
        case "GAME_STARTED":
        case "LOBBY_UPDATED":
          setGameState(normalizeGameState(message.payload, currentPlayerId));
          setError(null);
          break;
        case "GAME_ENDED":
        case "FINAL_RESULTS":
          setFinalResults(normalizeFinalResults(message.payload, currentPlayerId));
          setGameState((prev) =>
            prev
              ? { ...prev, gameStage: "complete" }
              : normalizeGameState(message.payload, currentPlayerId)
          );
          break;
        case "ERROR":
          setError(typeof message.payload === "string" ? message.payload : "Action failed");
          break;
        default:
          break;
      }
    };

    const onConnected = () => {
      if (!cancelled) setConnected(true);
    };
    const onDisconnected = () => setConnected(false);

    connectGameSocket(gameId, handleMessage, { onConnected, onDisconnected }).catch((err) => {
      if (!cancelled) setError(err.message);
    });

    return () => {
      cancelled = true;
      releaseGameSocket(handleMessage, { onConnected, onDisconnected });
      setConnected(false);
    };
  }, [gameId, playerId]);

  // Poll as backup so UI stays in sync if a WebSocket message is missed
  useEffect(() => {
    if (!gameId || !playerId) return;

    const sync = async () => {
      try {
        const lobby = await fetchLobby(gameId);
        setGameState(normalizeGameState(lobby.state, playerId));
      } catch {
        // ignore transient poll errors
      }
    };

    const interval = setInterval(sync, 2000);
    return () => clearInterval(interval);
  }, [gameId, playerId]);

  const dispatch = useCallback(
    async (action, extras = {}) => {
      if (!gameId || !playerId || readOnly) return false;

      const session = loadGameSession();
      const payload = {
        gameId,
        playerId,
        action,
        sessionToken: session?.sessionToken,
        ...extras,
      };

      try {
        const state = await postGameAction(payload);
        setGameState(normalizeGameState(state, playerId));
        setError(null);
        return true;
      } catch (err) {
        const message = err.message ?? "Action failed";
        const staleConflict =
          /not your turn|waiting for dice|not in housing|round start/i.test(message);

        if (staleConflict) {
          try {
            const lobby = await fetchLobby(gameId);
            setGameState(normalizeGameState(lobby.state, playerId));
          } catch {
            // ignore refresh failure
          }
          return false;
        }

        setError(message);
        if (/session token|invalid/i.test(message)) {
          const session = loadGameSession();
          if (session?.roomCode && session?.playerName && session.role !== "SPECTATOR") {
            try {
              const lobby = await joinLobby(session.roomCode, session.playerName);
              saveGameSession({
                ...session,
                playerId: lobby.playerId,
                sessionToken: lobby.sessionToken,
              });
              setGameState(normalizeGameState(lobby.state, lobby.playerId));
            } catch {
              // ignore
            }
          }
        }
        return false;
      }
    },
    [gameId, playerId, readOnly]
  );

  // Begin housing timers only after the player reaches the game screen
  useEffect(() => {
    if (readOnly) return;
    if (!gameId || !playerId || !connected || loading || enteredGameRef.current) return;

    enteredGameRef.current = true;
    dispatch("ENTER_GAME");
  }, [gameId, playerId, connected, loading, dispatch, readOnly]);

  return {
    gameState,
    finalResults,
    connected,
    error,
    loading,
    readOnly,
    dispatch,
    selectHousing: (rentType) =>
      dispatch("SELECT_HOUSING", {
        rentType: String(rentType ?? "")
          .trim()
          .toUpperCase(),
      }),
    paySurvival: (rentDiceRoll = null) =>
      dispatch("PAY_SURVIVAL", { rentDiceRoll: sanitizeNumber(rentDiceRoll) }),
    payLoan: (loanAmount) =>
      dispatch("PAY_LOAN", { loanAmount: sanitizeNumber(loanAmount) }),
    skipLoan: () => dispatch("SKIP_LOAN"),
    borrowFromBank: (amount) =>
      dispatch("BORROW_FROM_BANK", { loanAmount: sanitizeNumber(amount) }),
    rollDice: (diceRoll) =>
      dispatch("ROLL_DICE", { diceRoll: sanitizeNumber(diceRoll) }),
    dismissRoundStart: () => dispatch("DISMISS_ROUND_START"),
    setReady: () => dispatch("SET_READY"),
    startGame: () => dispatch("START_GAME"),
  };
};
