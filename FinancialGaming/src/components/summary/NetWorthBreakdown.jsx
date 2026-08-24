import { formatNaira } from "../../game/gameCalculations";

export const NetWorthBreakdown = ({ breakdown, isHighlighted }) => (
  <div
    className={`rounded-[2rem] border p-6 transition-all ${
      isHighlighted
        ? "border-accent-blue bg-accent-blue/5 shadow-lg shadow-accent-blue/10"
        : "border-gray-800 bg-black/20"
    }`}
  >
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className={`font-black italic uppercase tracking-tighter text-lg ${isHighlighted ? "text-accent-blue" : "text-white"}`}>
          {breakdown.name}
        </h3>
        <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">
          Rank #{breakdown.rank}
        </p>
      </div>
      {breakdown.rank === 1 && (
        <span className="bg-naira-gold text-black text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
          Winner
        </span>
      )}
    </div>

    <div className="space-y-3 mb-6">
      {breakdown.steps.map((step) => (
        <div key={step.label} className="flex justify-between items-center text-sm">
          <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">
            {step.label}
          </span>
          <span
            className={`font-mono font-bold ${
              step.type === "loan"
                ? "text-accent-red"
                : step.type === "net"
                  ? "text-naira-gold text-lg"
                  : "text-white"
            }`}
          >
            {step.type === "loan" ? "− " : step.type === "net" ? "= " : ""}
            {formatNaira(Math.abs(step.value))}
          </span>
        </div>
      ))}
    </div>

    <div className="pt-4 border-t border-gray-800">
      <p className="text-[10px] text-gray-600 font-mono text-center">{breakdown.formula}</p>
    </div>
  </div>
);
