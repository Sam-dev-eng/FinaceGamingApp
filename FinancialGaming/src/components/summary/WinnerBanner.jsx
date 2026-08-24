import { formatNaira } from "../../game/gameCalculations";

export const WinnerBanner = ({ winner, isCurrentPlayerWinner, totalRounds = 4 }) => (
  <div className="relative overflow-hidden rounded-[2.5rem] border border-naira-gold/40 bg-gradient-to-br from-naira-gold/20 via-card-bg to-accent-blue/10 p-10 text-center shadow-2xl shadow-naira-gold/10">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.15),transparent_60%)]" />
    <div className="relative z-10">
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-naira-gold mb-4">
        {isCurrentPlayerWinner ? "Victory!" : "Game Over"}
      </p>
      <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-3">
        {isCurrentPlayerWinner ? "You Are Financially Free!" : `${winner.name} Wins!`}
      </h2>
      <p className="text-gray-400 text-sm mb-6">
        Highest net worth after {totalRounds} rounds — cash minus remaining loan.
      </p>
      <div className="inline-flex flex-col items-center gap-2 bg-black/40 rounded-3xl px-10 py-6 border border-naira-gold/30">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Winner Net Worth</p>
        <p className="text-4xl font-mono text-naira-gold">{formatNaira(winner.netWorth)}</p>
      </div>
    </div>
  </div>
);
