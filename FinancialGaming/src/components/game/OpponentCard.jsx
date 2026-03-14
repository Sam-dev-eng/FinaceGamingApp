export const OpponentCard = ({ name, balance, status, isTakingTurn }) => (
  <div className={`bg-card-bg p-4 rounded-2xl border transition-all w-64 ${isTakingTurn ? 'border-naira-gold shadow-lg shadow-naira-gold/10' : 'border-gray-800'}`}>
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-gray-700 border border-gray-600" />
      <div>
        <h4 className="text-gray-400 text-[10px] font-black uppercase tracking-wider">{name}</h4>
        <p className="text-naira-gold font-mono text-lg leading-none">₦{balance}</p>
      </div>
    </div>
    <div className="mt-2 flex justify-between items-center border-t border-gray-800 pt-2">
      <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Status</span>
      <span className={`text-[9px] font-black uppercase ${isTakingTurn ? 'text-naira-gold' : 'text-gray-600'}`}>
        {status}
      </span>
    </div>
  </div>
);
