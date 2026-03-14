export const ResultRow = ({ rank, name, netWorth, isMain }) => {
  const rankColors = ["border-naira-gold", "border-gray-400", "border-orange-900"];

  return (
    <div className={`flex items-center gap-4 p-5 rounded-2xl bg-card-bg border-l-4 mb-4 transition-all ${
      isMain ? 'ring-2 ring-accent-blue shadow-lg shadow-accent-blue/10' : 'border-gray-800'
    } ${rankColors[rank-1] || 'border-gray-800'}`}>
      
      <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center font-black text-sm italic">
        {rank}
      </div>

      <div className="w-12 h-12 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center text-2xl">
        👤
      </div>

      <div className="flex-grow">
        <h4 className={`font-black italic tracking-tighter ${isMain ? 'text-accent-blue text-lg' : 'text-white'}`}>
          {name}
        </h4>
        <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Final Rank</p>
      </div>

      <div className="text-right">
        <p className="text-[9px] text-gray-500 uppercase font-black tracking-tighter mb-1 leading-none">Net Worth</p>
        <p className="text-2xl font-mono text-naira-gold leading-none">₦{netWorth}</p>
      </div>
    </div>
  );
};
