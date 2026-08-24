import { formatNaira } from "../../game/gameCalculations";

export const RoundLedger = ({ roundHistory }) => {
  if (!roundHistory?.length) {
    return (
      <p className="text-center text-gray-600 text-xs uppercase tracking-widest py-8">
        Round history will appear here once synced from the server.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {roundHistory.map((round) => (
        <div
          key={round.round}
          className="rounded-2xl border border-gray-800 bg-black/30 p-5"
        >
          <div className="flex justify-between items-center mb-4">
            <h5 className="text-accent-blue text-[10px] font-black uppercase tracking-[0.4em]">
              Round {round.round}
            </h5>
            <span className="text-[9px] text-gray-600 uppercase tracking-widest">6 months</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <LedgerLine label="Salary" value={round.salary} type="gain" />
            <LedgerLine label="Rent" value={round.rent} type="loss" />
            <LedgerLine label="Survival" value={round.survival} type="loss" />
            <LedgerLine label="Loan Paid" value={round.loanPaid} type="loss" />
            {round.loanInterest > 0 && (
              <LedgerLine label="Loan Interest (+10%)" value={round.loanInterest} type="loss" />
            )}
            {round.diceEvent && (
              <LedgerLine
                label={round.diceEvent.name}
                value={round.diceEvent.amount}
                type={round.diceEvent.type === "GAIN" ? "gain" : "loss"}
                className="col-span-2"
              />
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between text-xs">
            <span className="text-gray-500 uppercase tracking-widest font-bold">End of Round</span>
            <span className="font-mono text-naira-gold">
              {formatNaira(round.endingCash - round.endingLoan)} net
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

const LedgerLine = ({ label, value, type, className = "" }) => (
  <div className={`flex justify-between ${className}`}>
    <span className="text-gray-500 font-bold uppercase tracking-widest">{label}</span>
    <span className={`font-mono font-bold ${type === "gain" ? "text-accent-green" : "text-accent-red"}`}>
      {type === "gain" ? "+ " : "− "}
      {formatNaira(value)}
    </span>
  </div>
);
