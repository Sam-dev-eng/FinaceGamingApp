import { useState } from 'react';

export const EventArea = ({ eventTitle, eventDesc, isActive }) => {
  const [diceValue, setDiceValue] = useState(1);
  const [isRolling, setIsRolling] = useState(false);

  const rollDice = () => {
    
    if (isRolling || !isActive) return; 

    setIsRolling(true);

    const rollInterval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
    }, 100);

    setTimeout(() => {
      clearInterval(rollInterval);
      
      const finalValue = Math.floor(Math.random() * 6) + 1;
      setDiceValue(finalValue);
      setIsRolling(false);

      // LOG FOR API - READY TO SEND
      console.log("🎲 DICE ROLL RESULT:", finalValue);
    }, 1000);
  };

  const diceFaces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

  return (
    <div className={`flex-grow bg-card-bg/20 rounded-[2.5rem] border border-gray-800/50 flex flex-col items-center justify-center relative backdrop-blur-sm transition-all duration-500 ${!isActive ? 'grayscale-[0.5] opacity-80' : ''}`}>
      
      {/* Decorative Turn Indicator dots from Figma design */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-2">
        {[1, 2, 3].map(i => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-accent-blue shadow-[0_0_8px_#3B82F6]' : 'bg-gray-800'}`} />
        ))}
      </div>

      <div className="text-center">
        {/* Dice Animation */}
        <div className={`text-8xl mb-8 transition-all duration-100 ${isRolling ? 'animate-spin scale-110 text-naira-gold' : 'text-white'}`}>
          {diceFaces[diceValue - 1]}
        </div>

        <div className="bg-black/60 p-8 rounded-3xl border border-gray-700 max-w-md shadow-2xl">
          <p className="text-accent-red text-[10px] font-black uppercase tracking-[0.3em] mb-2">
            {isActive ? "Incoming Event" : "Waiting for Opponent"}
          </p>
          
          <h2 className={`text-xl font-black mb-1 transition-colors ${isActive ? 'text-white' : 'text-gray-600'}`}>
            {isActive ? eventTitle : "OPPONENT IS PLAYING..."}
          </h2>
          
          <p className="text-gray-400 text-xs italic">
            {isActive ? eventDesc : "Please wait for your turn to make financial decisions."}
          </p>
          
          <button 
            onClick={rollDice}
            disabled={isRolling || !isActive}
            className={`mt-6 px-10 py-3 rounded-full text-xs font-black transition-all ${
              !isActive 
                ? 'bg-gray-900 text-gray-700 cursor-not-allowed border border-gray-800' 
                : isRolling 
                  ? 'bg-gray-800 text-gray-500' 
                  : 'bg-white text-black hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-white/5'
            }`}
          >
            {isRolling ? "ROLLING..." : !isActive ? "LOCKED" : "ROLL DICE"}
          </button>
        </div>
      </div>
    </div>
  );
};
