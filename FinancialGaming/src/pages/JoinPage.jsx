import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { clearGameSession } from "../shared/session/gameSessionStorage";

export const JoinPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const codeFromUrl = searchParams.get("code");
    if (codeFromUrl) {
      setRoomCode(codeFromUrl.toUpperCase());
    }
  }, [searchParams]);

  const handleJoin = () => {
    if (!roomCode.trim()) {
      setError("Enter a room code");
      return;
    }
    if (!playerName.trim()) {
      setError("Enter your name");
      return;
    }

    setError("");
    clearGameSession();
    navigate("/lobby", {
      state: {
        mode: "join",
        roomCode: roomCode.trim().toUpperCase(),
        playerName: playerName.trim(),
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

        <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Join Lobby</h2>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-8">
          Enter the room code from your host — updates appear in real time
        </p>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-black uppercase text-accent-blue tracking-widest block mb-2">
              Game Room Code
            </label>
            <input
              type="text"
              placeholder="E.G. ABC-123"
              value={roomCode}
              className="w-full bg-black/40 border border-gray-800 p-4 rounded-xl font-mono text-xl tracking-widest focus:border-accent-blue outline-none transition uppercase"
              onChange={(e) => setRoomCode(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-accent-blue tracking-widest block mb-2">
              Your Name
            </label>
            <input
              type="text"
              placeholder="Your display name"
              value={playerName}
              className="w-full bg-black/40 border border-gray-800 p-4 rounded-xl text-lg focus:border-accent-blue outline-none transition"
              onChange={(e) => setPlayerName(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={handleJoin}
            className="w-full bg-accent-blue text-white py-5 rounded-xl font-black text-xl italic tracking-tighter hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-accent-blue/20 mt-4 cursor-pointer"
          >
            ENTER FRENZY
          </button>
        </div>
        <p className="text-gray-600 text-[10px] uppercase tracking-widest mt-6 text-center">
          Just watching?{" "}
          <button
            type="button"
            onClick={() =>
              navigate("/watch", {
                state: { roomCode: roomCode.trim().toUpperCase() },
              })
            }
            className="text-accent-blue hover:underline"
          >
            Enter as spectator
          </button>
        </p>
      </div>
    </div>
  );
};
