import { useNavigate, useLocation } from "react-router";
import { resolveSession, isSpectatorSession } from "../shared/session/gameSessionStorage";

export const CaseStudyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const session = resolveSession(location.state ?? {});
  const isSpectator = isSpectatorSession(session);

  const begin = () => {
    if (!session.gameId || !session.playerId) {
      navigate(isSpectator ? "/watch" : "/lobby");
      return;
    }
    navigate("/game", { state: session });
  };

  return (
    <div className="min-h-screen bg-game-bg text-white flex flex-col items-center justify-center p-8 font-sans relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent-blue/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-naira-gold/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl">
        <p className="text-accent-blue text-[10px] font-black uppercase tracking-[0.5em] text-center mb-6">
          Case Study — Round 1
        </p>

        <div className="bg-card-bg rounded-[2.5rem] border border-gray-800 p-10 md:p-12 shadow-2xl">
          <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter mb-8 text-center leading-tight">
            You Are Now Officially a{" "}
            <span className="text-accent-blue">Software Engineer</span>
          </h1>

          <div className="space-y-5 text-gray-300 text-sm md:text-base leading-relaxed">
            <p>
              After months of sleepless nights, debugging frustration, and endless
              learning at{" "}
              <span className="text-white font-bold">Semicolon</span>, you have
              finally gotten your first job.
            </p>
            <p>You just received your offer letter.</p>
            <p>
              Your salary is{" "}
              <span className="text-naira-gold font-mono font-bold">₦400,000</span>{" "}
              per month.
            </p>
            <p>
              That is{" "}
              <span className="text-naira-gold font-mono font-bold">
                ₦2,400,000
              </span>{" "}
              every 6 months.
            </p>
          </div>

          <div className="mt-10 p-6 rounded-2xl border border-accent-red/30 bg-accent-red/5">
            <p className="text-accent-red text-[10px] font-black uppercase tracking-[0.3em] mb-2">
              Very Important Rule
            </p>
            <p className="font-black italic uppercase text-lg tracking-tighter">
              Rent Is Compulsory
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Choose your housing wisely — it affects your finances every round.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            <StatBox label="Starting Cash" value="₦2.4M" />
            <StatBox label="Student Loan" value="₦1.5M" />
            <StatBox label="Credit Score" value="500" />
          </div>

          <button
            type="button"
            onClick={begin}
            className="w-full mt-10 bg-white text-black py-5 rounded-2xl font-black text-xl italic tracking-tighter hover:scale-[1.02] active:scale-95 transition-all shadow-xl cursor-pointer"
          >
            {isSpectator ? "WATCH LIVE GAME" : "BEGIN YOUR JOURNEY"}
          </button>
        </div>
      </div>
    </div>
  );
};

const StatBox = ({ label, value }) => (
  <div className="bg-black/40 rounded-xl p-4 border border-gray-800">
    <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">
      {label}
    </p>
    <p className="text-naira-gold font-mono font-bold text-sm">{value}</p>
  </div>
);
