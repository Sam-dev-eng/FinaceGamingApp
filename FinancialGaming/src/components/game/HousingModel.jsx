import { useState } from "react";
import { HOUSING_OPTIONS } from "../../game/gameConstants";

const formatCost = (amount) => {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
  return `${Math.round(amount / 1000)}k`;
};

export const HousingModal = ({ isOpen, onConfirm }) => {
  const [selected, setSelected] = useState(null);

  const options = Object.values(HOUSING_OPTIONS).map((opt) => ({
    id: opt.id.toLowerCase(),
    name: opt.name,
    cost: formatCost(opt.baseCost),
    rule: opt.rule,
  }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-6">
      <div className="bg-card-bg w-full max-w-2xl rounded-t-[2rem] sm:rounded-[3rem] border border-gray-800 p-5 sm:p-8 md:p-12 shadow-2xl max-h-[92dvh] overflow-y-auto custom-scrollbar">
        <div className="text-center mb-6 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter mb-2">
            Compulsory Decision
          </h2>
          <p className="text-accent-blue text-xs font-black uppercase tracking-[0.4em]">
            Rent is Compulsory — choose once before the game starts
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelected(opt)}
              className={`p-6 rounded-2xl border-2 text-left transition-all ${
                selected?.id === opt.id
                  ? "border-accent-blue bg-accent-blue/10"
                  : "border-gray-800 bg-black/20 hover:border-gray-600"
              }`}
            >
              <h3 className="font-black uppercase text-sm mb-1">{opt.name}</h3>
              <p className="text-naira-gold font-mono text-xl">₦{opt.cost}</p>
              <p className="text-[10px] text-gray-500 uppercase mt-2 font-bold">{opt.rule}</p>
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={!selected}
          onClick={() => onConfirm(selected)}
          className={`w-full py-5 rounded-2xl font-black text-xl italic tracking-tighter transition-all ${
            selected
              ? "bg-white text-black hover:scale-[1.02] shadow-xl"
              : "bg-gray-800 text-gray-600 cursor-not-allowed"
          }`}
        >
          CONFIRM DECISION
        </button>
      </div>
    </div>
  );
};
