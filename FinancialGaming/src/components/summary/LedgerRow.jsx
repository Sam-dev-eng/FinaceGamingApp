export const LedgerRow = ({ round, income, expenses, eventName, eventCost }) => {
  return (
    <div className="py-5 border-b border-gray-800/50 last:border-0 group">
      <div className="flex justify-between items-center mb-3">
        <h5 className="text-accent-blue text-[10px] font-black uppercase tracking-[0.4em]">Round {round}</h5>
        <span className="h-px flex-grow mx-4 bg-gray-800 group-hover:bg-gray-700 transition-colors"></span>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500 font-bold uppercase tracking-widest">Income / Salary</span>
          <span className="text-accent-green font-mono font-bold">+ ₦{income}</span>
        </div>
        
        {eventName && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-500 font-bold uppercase tracking-widest">{eventName}</span>
            <span className="text-accent-red font-mono font-bold">- ₦{eventCost}</span>
          </div>
        )}
      </div>
    </div>
  );
};
