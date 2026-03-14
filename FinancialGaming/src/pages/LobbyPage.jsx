import { useNavigate } from 'react-router';
import { LobbySlot } from '../components/lobby/lobbySlot';

export const LobbyPage = () => {
  const navigate = useNavigate();

  // This data will eventually come from your backend API
  const lobbyData = {
    roomCode: "BXT-452",
    players: [
      { id: 1, name: "YOU", status: "READY", isHost: true },
      { id: 2, name: "OPPONENT A", status: "JOINING...", isHost: false },
      // The third slot is currently empty
    ]
  };

  const totalPlayers = lobbyData.players.length;
  const isFull = totalPlayers >= 3;

  return (
    <div className="min-h-screen bg-game-bg text-white flex flex-col items-center justify-center p-8 font-sans overflow-hidden">
      
      {/* Header Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-black italic tracking-tighter mb-4 uppercase scale-y-110">
          Finance <span className="text-accent-blue">Frenzy</span>
        </h1>
        <div className="inline-flex items-center gap-3 bg-card-bg px-6 py-2 rounded-full border border-gray-800 shadow-xl">
          <span className="text-naira-gold text-xs font-black uppercase tracking-widest">Lobby Room:</span>
          <span className="font-mono text-lg font-bold tracking-widest">{lobbyData.roomCode}</span>
        </div>
      </div>

      {/* 3-Player Grid (Match Figma Layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 w-full max-w-2xl mb-16">
        {/* Slot 1 & 2 */}
        <LobbySlot {...lobbyData.players[0]} />
        <LobbySlot {...lobbyData.players[1]} />
        
        {/* Slot 3 & Empty Placeholder */}
        <LobbySlot isEmpty={true} />
        <div className="p-8 rounded-[2rem] border-2 border-gray-900 bg-black/10 flex items-center justify-center opacity-30">
           <span className="text-xs font-bold uppercase tracking-widest">Waiting for Server...</span>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex flex-col items-center gap-4">
        <button 
          onClick={() => navigate('/game')}
          className={`px-16 py-5 rounded-2xl font-black text-xl italic tracking-tighter transition-all shadow-2xl ${
            isFull 
            ? 'bg-white text-black hover:scale-105 active:scale-95 cursor-pointer shadow-white/10' 
            : 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700'
          }`}
        >
          {isFull ? "START GAME" : "WAITING FOR PLAYERS (2/3)..."}
        </button>
        <p className="text-gray-600 text-[10px] font-bold uppercase tracking-[0.5em] animate-pulse">
          Connection Secure
        </p>
      </div>

    </div>
  );
};
