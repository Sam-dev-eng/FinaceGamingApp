// src/components/PlayerCard.jsx
export const PlayerCard = ({ name, balance, isMain, status = "Ready" }) => {
  const isReady = status === "Ready";
  
  return (
    <div className={`p-4 rounded-xl border transition-all ${
      isMain ? 'w-full bg-cardBg border-gray-700' : 'w-72 bg-black/40 border-gray-800'
    } ${!isReady && 'opacity-50'}`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-gray-700 border-2 ${isReady ? 'border-actionGreen' : 'border-gray-500'}`}>
          👤
        </div>
        <div>
          <h3 className="text-gray-400 text-xs font-black uppercase tracking-wider">{name}</h3>
          <p className="text-nairaGold text-lg font-mono leading-none">₦{balance}</p>
        </div>
      </div>
      
      {isMain && (
        <div className="mt-4 flex gap-2">
          <button className="flex-1 bg-actionGreen text-[10px] font-black py-2 rounded hover:brightness-110">PAY LOAN</button>
          <button className="flex-1 bg-blue-600 text-[10px] font-black py-2 rounded hover:brightness-110">VIEW APARTMENT</button>
        </div>
        
      )}
    </div>
  );
};
