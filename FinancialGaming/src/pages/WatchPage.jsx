import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { fetchRoomByCode } from "../services/api";
import { clearGameSession } from "../shared/session/gameSessionStorage";

export const WatchPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [roomCode, setRoomCode] = useState("");
  const [spectatorName, setSpectatorName] = useState("");
  const [error, setError] = useState("");
  const [roomPreview, setRoomPreview] = useState(null);
  const [checkingRoom, setCheckingRoom] = useState(false);

  useEffect(() => {
    const codeFromUrl = searchParams.get("code");
    if (codeFromUrl) {
      setRoomCode(codeFromUrl.toUpperCase());
    }
  }, [searchParams]);

  useEffect(() => {
    const code = roomCode.trim().toUpperCase();
    if (code.length < 4) {
      setRoomPreview(null);
      return;
    }

    let cancelled = false;
    setCheckingRoom(true);

    fetchRoomByCode(code)
      .then((lobby) => {
        if (cancelled) return;
        const stage = lobby.state?.gameStage ?? "LOBBY";
        setRoomPreview({
          roomCode: lobby.roomCode,
          playerCount: lobby.players?.length ?? 0,
          spectatorCount: lobby.spectators?.length ?? 0,
          inProgress: stage !== "LOBBY" && stage !== "lobby",
        });
        setError("");
      })
      .catch(() => {
        if (!cancelled) setRoomPreview(null);
      })
      .finally(() => {
        if (!cancelled) setCheckingRoom(false);
      });

    return () => {
      cancelled = true;
    };
  }, [roomCode]);

  const handleWatch = () => {
    if (!roomCode.trim()) {
      setError("Enter a room code");
      return;
    }
    if (!spectatorName.trim()) {
      setError("Enter your display name");
      return;
    }

    setError("");
    clearGameSession();
    navigate("/lobby", {
      state: {
        mode: "spectate",
        roomCode: roomCode.trim().toUpperCase(),
        playerName: spectatorName.trim(),
        role: "SPECTATOR",
      },
    });
  };

  return (
    <div className="min-h-screen bg-game-bg text-white flex flex-col items-center justify-center p-8 font-sans">
      <div className="w-full max-w-md bg-card-bg p-10 rounded-[2.5rem] border border-gray-800 shadow-2xl relative">
        {error && (
          <div className="mb-6 bg-accent-red/20 border border-accent-red rounded-xl p-3 text-center">
            <span className="text-accent-red text-[10px] font-black uppercase tracking-[0.2em]">
              ⚠️ {error}
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-gray-500 text-xs font-black uppercase tracking-widest mb-8 hover:text-white transition cursor-pointer"
        >
          ← Back
        </button>

        <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2">
          Watch Room
        </h2>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-8">
          View-only — enter a room code to spectate live
        </p>

        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block mb-2">
          Room Code
        </label>
        <input
          type="text"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          placeholder="e.g. FIN7K2"
          className="w-full bg-black/40 border border-gray-800 p-4 rounded-xl font-mono text-lg tracking-widest focus:border-accent-blue outline-none transition mb-4 uppercase"
        />

        {checkingRoom && (
          <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest mb-4">
            Looking up room…
          </p>
        )}

        {roomPreview && (
          <div className="mb-6 p-4 rounded-xl border border-gray-800 bg-black/30 text-[10px] uppercase tracking-widest space-y-1">
            <p className="text-accent-green font-black">Room found</p>
            <p className="text-gray-500">
              Players: {roomPreview.playerCount}/3 · Watching: {roomPreview.spectatorCount}
            </p>
            <p className={roomPreview.inProgress ? "text-naira-gold" : "text-gray-400"}>
              {roomPreview.inProgress ? "Game in progress" : "Waiting in lobby"}
            </p>
          </div>
        )}

        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block mb-2">
          Your Display Name
        </label>
        <input
          type="text"
          value={spectatorName}
          onChange={(e) => setSpectatorName(e.target.value)}
          placeholder="Spectator name"
          className="w-full bg-black/40 border border-gray-800 p-4 rounded-xl focus:border-accent-blue outline-none transition mb-8"
          onKeyDown={(e) => e.key === "Enter" && handleWatch()}
        />

        <button
          type="button"
          onClick={handleWatch}
          className="w-full bg-accent-blue text-white py-5 rounded-2xl font-black text-xl italic tracking-tighter hover:scale-[1.02] active:scale-95 transition-all shadow-xl cursor-pointer"
        >
          ENTER AS SPECTATOR
        </button>

        <p className="text-gray-600 text-[10px] uppercase tracking-widest mt-6 text-center">
          Want to play instead?{" "}
          <button
            type="button"
            onClick={() =>
              navigate("/join", {
                state: { roomCode: roomCode.trim().toUpperCase() },
              })
            }
            className="text-accent-blue hover:underline"
          >
            Join as player
          </button>
        </p>
      </div>
    </div>
  );
};
