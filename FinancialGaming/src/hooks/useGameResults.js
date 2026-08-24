import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { connectGameSocket, disconnectGameSocket } from "../services/Websocket";
import { normalizeFinalResults } from "../services/gameStateAdapter";
import { mockGameResults } from "../game/mockGameResults";
import {
  buildNetWorthBreakdown,
  rankPlayersByNetWorth,
  getWinner,
} from "../game/gameCalculations";

export const useGameResults = () => {
  const location = useLocation();
  const [results, setResults] = useState(location.state?.gameResults ?? null);
  const [loading, setLoading] = useState(!location.state?.gameResults);

  useEffect(() => {
    if (location.state?.gameResults) {
      setResults(location.state.gameResults);
      setLoading(false);
      return;
    }

    const gameId = location.state?.gameId ?? mockGameResults.gameId;

    connectGameSocket(gameId, (message) => {
      if (message.type === "GAME_ENDED" || message.type === "FINAL_RESULTS") {
        setResults(normalizeFinalResults(message.payload));
        setLoading(false);
      }
    });

    const fallbackTimer = setTimeout(() => {
      setResults((current) => current ?? mockGameResults);
      setLoading(false);
    }, 5000);

    return () => {
      clearTimeout(fallbackTimer);
      disconnectGameSocket();
    };
  }, [location.state]);

  const rankedPlayers = results ? rankPlayersByNetWorth(results.players) : [];
  const winner = results ? getWinner(results.players) : null;
  const currentPlayerId = results?.currentPlayerId ?? "player-1";

  const breakdowns = rankedPlayers.map((player) => ({
    ...buildNetWorthBreakdown(player),
    rank: player.rank,
  }));

  const currentPlayer = results?.players?.find((p) => p.id === currentPlayerId);

  return {
    results,
    loading,
    rankedPlayers,
    winner,
    breakdowns,
    currentPlayer,
    currentPlayerId,
    isCurrentPlayerWinner: winner?.id === currentPlayerId,
  };
};
