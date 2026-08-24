import { useState } from "react";
import { useNavigate } from "react-router";
import { LobbySlot } from "../components/lobby/lobbySlot";
import { LobbyActivityFeed } from "../components/lobby/LobbyActivityFeed";
import { useLobbySession } from "../hooks/useLobbySession";
import { buildJoinUrl, buildWatchUrl } from "../shared/session/gameSessionStorage";

export const LobbyPage = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const {
    roomCode,
    connected,
    loading,
    error,
    activity,
    slots,
    isFull,
    allReady,
    isHost,
    isSpectator,
    spectators,
    amReady,
    hasBots,
    humanCount,
    handleFillBots,
    handleReadyAll,
    handleReadySelf,
    handleStartGame,
    handleExitLobby,
    handleRemovePlayer,
    gameId,
    playerId,
  } = useLobbySession();

  const copyRoomCode = async () => {
    if (!roomCode) return;
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyJoinLink = async () => {
    if (!roomCode) return;
    await navigator.clipboard.writeText(buildJoinUrl(roomCode));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyWatchLink = async () => {
    if (!roomCode) return;
    await navigator.clipboard.writeText(buildWatchUrl(roomCode));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-game-bg text-white flex flex-col items-center justify-center font-sans gap-4">
        <p className="text-accent-blue text-sm font-black uppercase tracking-widest animate-pulse">
          Connecting to lobby…
        </p>
        {error && (
          <p className="text-accent-red text-xs font-bold uppercase tracking-widest max-w-md text-center px-6">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-game-bg text-white flex flex-col items-center justify-center p-8 font-sans overflow-hidden">
      <div className="text-center mb-16">
        {isSpectator && (
          <div className="mb-6 inline-block bg-accent-blue/10 border border-accent-blue/40 px-6 py-2 rounded-full">
            <span className="text-accent-blue text-[10px] font-black uppercase tracking-[0.3em]">
              👁 Spectator mode — view only
            </span>
          </div>
        )}
        <h1 className="text-5xl font-black italic tracking-tighter mb-4 uppercase scale-y-110">
          Finance <span className="text-accent-blue">Frenzy</span>
        </h1>
        <div className="inline-flex items-center gap-3 bg-card-bg px-6 py-2 rounded-full border border-gray-800 shadow-xl">
          <span className="text-naira-gold text-xs font-black uppercase tracking-widest">
            Lobby Room:
          </span>
          <span className="font-mono text-lg font-bold tracking-widest">{roomCode ?? "—"}</span>
        </div>
        {isHost && roomCode && (
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            <button
              type="button"
              onClick={copyRoomCode}
              className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg border border-gray-700 hover:border-accent-blue transition"
            >
              {copied ? "Copied!" : "Copy Code"}
            </button>
            <button
              type="button"
              onClick={copyJoinLink}
              className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg border border-gray-700 hover:border-accent-green transition"
            >
              Copy Join Link
            </button>
            <button
              type="button"
              onClick={copyWatchLink}
              className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg border border-gray-700 hover:border-accent-blue transition"
            >
              Copy Watch Link
            </button>
          </div>
        )}
        <p className="text-gray-600 text-[10px] uppercase tracking-widest mt-4 max-w-md mx-auto">
          {isSpectator
            ? "You will follow the game live when the host starts — no player actions"
            : "Share the code with friends — updates push instantly over WebSocket while this tab is active"}
        </p>
        {spectators.length > 0 && (
          <p className="text-gray-500 text-[10px] uppercase tracking-widest mt-2">
            {spectators.length} spectator{spectators.length !== 1 ? "s" : ""} watching
          </p>
        )}
      </div>

      {error && (
        <div className="mb-6 max-w-lg w-full bg-accent-red/10 border border-accent-red/40 rounded-xl p-4 text-center">
          <p className="text-accent-red text-xs font-bold uppercase tracking-widest">{error}</p>
        </div>
      )}

      <LobbyActivityFeed activity={activity} connected={connected} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl mb-10">
        {slots.map((slot) =>
          slot.isEmpty ? (
            <LobbySlot key={slot.key} isEmpty />
          ) : (
            <LobbySlot
              key={slot.key}
              name={slot.name}
              status={slot.status}
              isHost={slot.isHost}
              isBot={slot.isBot}
              canRemove={
                isHost &&
                !isSpectator &&
                slot.playerId &&
                slot.playerId !== playerId &&
                !slot.isHost
              }
              onRemove={
                slot.playerId
                  ? () => handleRemovePlayer(slot.playerId)
                  : undefined
              }
            />
          )
        )}
      </div>

      <div className="flex flex-col items-center gap-4">
        {!isSpectator && isHost && hasBots && humanCount < 3 && (
          <p className="text-naira-gold text-[10px] font-bold uppercase tracking-widest text-center max-w-md">
            Practice opponents occupy slots — friends who join will replace a bot automatically
          </p>
        )}

        {!isSpectator && isHost && !isFull && (
          <button
            type="button"
            onClick={handleFillBots}
            className="px-10 py-3 rounded-xl border border-gray-700 text-xs font-black uppercase tracking-widest hover:border-accent-blue transition cursor-pointer"
          >
            Add Practice Opponents
          </button>
        )}

        {!isSpectator && !amReady && (
          <button
            type="button"
            onClick={handleReadySelf}
            className="px-10 py-3 rounded-xl bg-accent-blue/20 border border-accent-blue text-xs font-black uppercase tracking-widest hover:bg-accent-blue/30 transition cursor-pointer"
          >
            I'm Ready
          </button>
        )}

        {!isSpectator && isHost && isFull && !allReady && (
          <button
            type="button"
            onClick={handleReadyAll}
            className="px-10 py-3 rounded-xl border border-accent-blue text-xs font-black uppercase tracking-widest hover:bg-accent-blue/10 transition cursor-pointer"
          >
            Ready All Players (Practice)
          </button>
        )}

        {isSpectator ? (
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest text-center max-w-md px-6">
            Waiting for the host to start the game…
          </p>
        ) : (
          <button
            type="button"
            onClick={handleStartGame}
            disabled={!isHost || !allReady}
            className={`px-16 py-5 rounded-2xl font-black text-xl italic tracking-tighter transition-all shadow-2xl ${
              isHost && allReady
                ? "bg-white text-black hover:scale-105 active:scale-95 cursor-pointer shadow-white/10"
                : "bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700"
            }`}
          >
            {!isFull
              ? `WAITING FOR PLAYERS (${slots.filter((s) => !s.isEmpty).length}/3)…`
              : !allReady
                ? "WAITING FOR ALL READY…"
                : "START GAME"}
          </button>
        )}

        <p
          className={`text-[10px] font-bold uppercase tracking-[0.5em] ${
            connected ? "text-accent-green animate-pulse" : "text-accent-red"
          }`}
        >
          {connected ? "Live — Real-time sync" : "Connecting…"}
        </p>

        {gameId && playerId && (
          <p className="text-[9px] text-gray-700 font-mono">{gameId.slice(0, 8)}… · {playerId}</p>
        )}

        <button
          type="button"
          onClick={handleExitLobby}
          className="px-10 py-3 rounded-xl border border-accent-red/40 text-accent-red text-xs font-black uppercase tracking-widest hover:bg-accent-red/10 transition cursor-pointer mt-2"
        >
          Exit Lobby
        </button>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="text-gray-600 text-[10px] font-black uppercase tracking-widest hover:text-white transition mt-2"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
};
