import { useState } from "react";
import { useNavigate } from "react-router";
import { clearGameSession } from "../shared/session/gameSessionStorage";

export const HostPage = () => {
  const navigate = useNavigate();
  const [hostName, setHostName] = useState("");
  const [error, setError] = useState("");

  const handleHost = () => {
    if (!hostName.trim()) {
      setError("Enter your name to host");
      return;
    }
    if (hostName.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }

    setError("");
    clearGameSession();
    navigate("/lobby", {
      state: {
        mode: "host",
        playerName: hostName.trim(),
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

        <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Host Game</h2>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-8">
          Choose your display name — friends will see it in the lobby
        </p>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-black uppercase text-accent-blue tracking-widest block mb-2">
              Your Name
            </label>
            <input
              type="text"
              placeholder="e.g. Samuel"
              value={hostName}
              autoFocus
              className="w-full bg-black/40 border border-gray-800 p-4 rounded-xl text-lg focus:border-accent-blue outline-none transition"
              onChange={(e) => setHostName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleHost()}
            />
          </div>

          <button
            type="button"
            onClick={handleHost}
            className="w-full bg-white text-black py-5 rounded-xl font-black text-xl italic tracking-tighter hover:brightness-110 active:scale-95 transition-all shadow-xl mt-4 cursor-pointer"
          >
            CREATE LOBBY
          </button>
        </div>
      </div>
    </div>
  );
};
