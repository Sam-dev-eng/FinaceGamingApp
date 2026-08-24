import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { fetchLobby } from "../services/api";
import {
  connectGameSocket,
  releaseGameSocket,
  subscribeGameMessages,
} from "../services/Websocket";
import { loadGameSession, saveGameSession } from "../shared/session/gameSessionStorage";

const PRE_GAME_ROUTES = ["/lobby", "/case-study"];
const GAME_ROUTES = ["/lobby", "/case-study", "/game", "/summary"];

const isGameStartedStage = (stage) =>
  stage != null && stage !== "LOBBY" && stage !== "lobby";

/**
 * Keeps all players in sync when the host starts the game.
 * Listens for GAME_STARTED on every screen and navigates joiners to case study.
 */
export const GameRoomSync = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const session = loadGameSession();
    if (!session?.gameId || !session?.playerId) return;
    if (!GAME_ROUTES.includes(location.pathname)) return;

    const goToCaseStudy = () => {
      const current = loadGameSession() ?? session;
      saveGameSession(current);
      if (PRE_GAME_ROUTES.includes(location.pathname)) {
        navigate("/case-study", { state: current, replace: true });
      }
    };

    const checkAlreadyStarted = async () => {
      try {
        const lobby = await fetchLobby(session.gameId);
        const stage = lobby.state?.gameStage;
        if (isGameStartedStage(stage) && location.pathname === "/lobby") {
          saveGameSession({
            ...session,
            sessionToken: session.sessionToken ?? lobby.sessionToken,
          });
          goToCaseStudy();
        }
      } catch {
        // ignore
      }
    };

    const onMessage = (message) => {
      if (message.type === "GAME_STARTED") {
        goToCaseStudy();
      }
    };

    const unsubscribe = subscribeGameMessages(onMessage);

    connectGameSocket(session.gameId, null, {
      onConnected: checkAlreadyStarted,
    }).catch(() => {
      // lobby hook surfaces connection errors
    });

    return () => {
      unsubscribe();
      releaseGameSocket(null, { onConnected: checkAlreadyStarted });
    };
  }, [location.pathname, navigate]);

  return null;
};
