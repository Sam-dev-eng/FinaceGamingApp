import { usePhaseTimer } from "./hooks/useTurnTimer";
import { formatTurnTime } from "../../config/env";

export const RoundStartModal = ({
  round,
  players,
  isOpen,
  onContinue,
  phaseDeadlineEpochMs,
}) => {
  const { formattedTime, secondsLeft } = usePhaseTimer(
    phaseDeadlineEpochMs,
    isOpen,
    `${round}-${phaseDeadlineEpochMs}`
  );

  if (!isOpen || !players?.length) return null;

  return (
    <div className="fixed inset-0 z-[65] flex items-end sm:items-center justify-center bg-black/95 backdrop-blur-md p-3 sm:p-6">
      <div className="bg-card-bg w-full max-w-2xl rounded-t-[2rem] sm:rounded-[2.5rem] border border-gray-800 p-5 sm:p-8 md:p-10 shadow-2xl max-h-[92dvh] overflow-y-auto custom-scrollbar">
        <p className="text-accent-green text-[10px] font-black uppercase tracking-[0.5em] text-center mb-2">
          Round {round} — Balance Updates
        </p>
        <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-center mb-1">
          Salaries & Payouts
        </h2>
        <p className="text-gray-500 text-xs text-center mb-2">
          All players — review what changed before the round begins
        </p>
        <p className="text-center text-accent-blue text-xs font-black uppercase tracking-widest mb-8">
          Continuing in {formattedTime}
          {secondsLeft <= 3 && secondsLeft > 0 && (
            <span className="text-accent-red ml-2 animate-pulse">HURRY!</span>
          )}
        </p>

        <div className="space-y-4 mb-8">
          {players.map((player) => (
            <div
              key={player.id}
              className="rounded-2xl border border-gray-800 bg-black/30 p-5"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  {player.name}
                </h3>
                <span className="text-naira-gold font-mono text-sm font-bold">
                  Net ₦{player.netWorth.toLocaleString()}
                </span>
              </div>

              <div className="space-y-2">
                {player.events.map((event) => (
                  <div
                    key={`${player.id}-${event.label}-${event.amount}`}
                    className="flex justify-between items-start gap-3 text-xs"
                  >
                    <div>
                      <p
                        className={`font-black uppercase tracking-wide ${
                          event.type === "gain"
                            ? "text-accent-green"
                            : event.type === "loss"
                              ? "text-accent-red"
                              : event.type === "skip"
                                ? "text-accent-red"
                                : "text-gray-400"
                        }`}
                      >
                        {event.label}
                      </p>
                      <p className="text-gray-500 italic">{event.description}</p>
                    </div>
                    {event.amount > 0 && (
                      <span
                        className={`font-mono font-bold shrink-0 ${
                          event.type === "gain" ? "text-accent-green" : "text-accent-red"
                        }`}
                      >
                        {event.type === "gain" ? "+" : "−"}₦
                        {event.amount.toLocaleString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between text-[10px] uppercase tracking-widest text-gray-500">
                <span>Cash ₦{player.cash.toLocaleString()}</span>
                <span>Loan ₦{player.loan.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="w-full bg-white text-black py-4 rounded-2xl font-black text-lg italic tracking-tighter hover:scale-[1.02] active:scale-95 transition-all shadow-xl cursor-pointer"
        >
          CONTINUE TO ROUND {round}
        </button>
      </div>
    </div>
  );
};
