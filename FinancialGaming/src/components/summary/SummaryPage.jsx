import { useNavigate } from "react-router";
import { useGameResults } from "../../hooks/useGameResults";
import { WinnerBanner } from "./WinnerBanner";
import { NetWorthBreakdown } from "./NetWorthBreakdown";
import { RoundLedger } from "./RoundLedger";
import { ResultRow } from "./ResultRow";
import { TOTAL_ROUNDS } from "../../game/gameConstants";

export const SummaryPage = () => {
  const navigate = useNavigate();
  const {
    loading,
    rankedPlayers,
    winner,
    breakdowns,
    currentPlayer,
    isCurrentPlayerWinner,
  } = useGameResults();

  if (loading) {
    return (
      <div className="min-h-screen bg-game-bg text-white flex flex-col items-center justify-center font-sans">
        <div className="text-accent-blue text-5xl mb-6 animate-pulse">💠</div>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-500 animate-pulse">
          Calculating Final Net Worth...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-game-bg text-white flex flex-col items-center p-8 font-sans overflow-y-auto">
      <div className="w-full max-w-3xl mt-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black italic uppercase tracking-tighter scale-y-110 mb-2">
            Final <span className="text-accent-blue">Results</span>
          </h1>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em]">
            After {TOTAL_ROUNDS} Rounds — Net Worth = Cash − Loan
          </p>
          <div className="h-1 w-20 bg-accent-blue mx-auto rounded-full mt-4" />
        </div>

        {winner && (
          <section className="mb-10">
            <WinnerBanner
              winner={winner}
              isCurrentPlayerWinner={isCurrentPlayerWinner}
              totalRounds={TOTAL_ROUNDS}
            />
          </section>
        )}

        <section className="mb-10">
          <h2 className="text-sm font-black uppercase tracking-[0.4em] mb-6 text-center text-gray-400">
            Leaderboard
          </h2>
          {rankedPlayers.map((player) => (
            <ResultRow
              key={player.id}
              rank={player.rank}
              name={player.name}
              netWorth={player.netWorth.toLocaleString("en-NG")}
              isMain={player.id === currentPlayer?.id}
            />
          ))}
        </section>

        <section className="mb-10">
          <h2 className="text-sm font-black uppercase tracking-[0.4em] mb-6 text-center text-gray-400">
            Net Worth <span className="text-white">Calculations</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {breakdowns.map((breakdown) => (
              <NetWorthBreakdown
                key={breakdown.playerId}
                breakdown={breakdown}
                isHighlighted={breakdown.playerId === currentPlayer?.id}
              />
            ))}
          </div>
        </section>

        {currentPlayer?.roundHistory?.length > 0 && (
          <section className="bg-card-bg/40 rounded-[2.5rem] p-8 border border-gray-800 shadow-2xl backdrop-blur-sm mb-10">
            <h2 className="text-sm font-black uppercase tracking-[0.4em] mb-8 text-center text-gray-400">
              Your Round-by-Round <span className="text-white">Ledger</span>
            </h2>
            <RoundLedger roundHistory={currentPlayer.roundHistory} />
          </section>
        )}

        <div className="flex flex-col gap-4 mb-12">
          <button
            onClick={() => navigate("/")}
            className="w-full bg-white text-black py-5 rounded-2xl font-black text-xl italic tracking-tighter hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/5 cursor-pointer"
          >
            PLAY NEW GAME
          </button>
          <button className="text-[10px] font-black uppercase text-gray-600 tracking-[0.5em] hover:text-white transition cursor-pointer">
            Export Financial Report (PDF)
          </button>
        </div>
      </div>
    </div>
  );
};
