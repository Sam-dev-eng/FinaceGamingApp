import { AnimatedValue } from "./AnimatedValue";

export const OpponentCard = ({ name, netWorth, cash, loan, creditScore, status, isTakingTurn }) => (
  <div
    className={`bg-card-bg p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 w-full min-w-0 md:w-64 ${
      isTakingTurn ? "border-naira-gold" : "border-gray-800"
    }`}
  >
    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
      <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full bg-gray-700 border border-gray-600" />
      <div className="min-w-0 flex-1">
        <h4 className="text-gray-400 text-[9px] sm:text-[10px] font-black uppercase tracking-wider truncate">
          {name}
        </h4>
        <AnimatedValue
          value={netWorth}
          className="text-naira-gold font-mono text-base sm:text-lg leading-none"
          idleColor="text-naira-gold"
        />
        <p className="text-[7px] sm:text-[8px] text-gray-600 font-bold uppercase tracking-widest mt-0.5">
          Net Worth
        </p>
      </div>
    </div>
    <div className="mt-2 flex justify-between items-center gap-2 border-t border-gray-800 pt-2">
      <span className="text-[7px] sm:text-[8px] text-gray-500 font-bold uppercase tracking-widest shrink-0">
        Cash
      </span>
      <AnimatedValue
        value={cash}
        className="text-white font-mono text-[10px] sm:text-xs truncate"
        idleColor="text-white"
      />
    </div>
    {loan != null && (
      <div className="mt-1 flex justify-between items-center gap-2">
        <span className="text-[7px] sm:text-[8px] text-gray-500 font-bold uppercase tracking-widest shrink-0">
          Loan
        </span>
        <AnimatedValue
          value={loan}
          className="text-accent-red font-mono text-[10px] sm:text-xs truncate"
          idleColor="text-accent-red"
        />
      </div>
    )}
    {creditScore != null && (
      <div className="mt-1 flex justify-between items-center gap-2">
        <span className="text-[7px] sm:text-[8px] text-gray-500 font-bold uppercase tracking-widest shrink-0">
          Credit
        </span>
        <AnimatedValue
          value={creditScore}
          className={`font-mono text-[10px] sm:text-xs ${creditScore > 200 ? "text-accent-green" : "text-accent-red"}`}
          idleColor={creditScore > 200 ? "text-accent-green" : "text-accent-red"}
          prefix=""
          format={(n) => String(Math.round(n))}
        />
      </div>
    )}
    <div className="mt-1 flex justify-between items-center gap-2">
      <span className="text-[7px] sm:text-[8px] text-gray-500 font-bold uppercase tracking-widest shrink-0">
        Status
      </span>
      <span
        className={`text-[8px] sm:text-[9px] font-black uppercase truncate text-right ${isTakingTurn ? "text-naira-gold" : "text-gray-600"}`}
      >
        {status}
      </span>
    </div>
  </div>
);
