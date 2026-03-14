import { useState } from 'react';

export const HousingModal = ({ isOpen, onConfirm }) => {
  const [selected, setSelected] = useState(null);

  const options = [
    { id: 'parents', name: 'Stay with Parent/Guardian', cost: '150k', rule: 'Inflation @2% on dice' },
    { id: 'shared', name: 'Shared Apartment', cost: '300k', rule: '20% Fixed' },
    { id: 'single', name: 'Single Apartment', cost: '900k', rule: '15% Fixed' },
    { id: 'luxury', name: 'Luxury Apartment', cost: '1.5m', rule: '5% Fixed' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-6">
      <div className="bg-card-bg w-full max-w-2xl rounded-[3rem] border border-gray-800 p-12 shadow-2xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-2">Compulsory Decision</h2>
          <p className="text-accent-blue text-xs font-black uppercase tracking-[0.4em]">Rent is Compulsory</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSelected(opt)}
              className={`p-6 rounded-2xl border-2 text-left transition-all ${
                selected?.id === opt.id 
                ? 'border-accent-blue bg-accent-blue/10' 
                : 'border-gray-800 bg-black/20 hover:border-gray-600'
              }`}
            >
              <h3 className="font-black uppercase text-sm mb-1">{opt.name}</h3>
              <p className="text-naira-gold font-mono text-xl">₦{opt.cost}</p>
              <p className="text-[10px] text-gray-500 uppercase mt-2 font-bold">{opt.rule}</p>
            </button>
          ))}
        </div>

        <button
          disabled={!selected}
          onClick={() => onConfirm(selected)}
          className={`w-full py-5 rounded-2xl font-black text-xl italic tracking-tighter transition-all ${
            selected 
            ? 'bg-white text-black hover:scale-[1.02] shadow-xl' 
            : 'bg-gray-800 text-gray-600 cursor-not-allowed'
          }`}
        >
          CONFIRM DECISION & START ROUND 1
        </button>
      </div>
    </div>
  );
};
