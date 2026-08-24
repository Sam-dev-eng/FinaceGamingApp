import { useNavigate, useLocation } from 'react-router';

export const LandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const notice = location.state?.notice;

  const hostGame = () => {
    navigate('/host');
  };

  return (
    <div className="min-h-screen bg-game-bg text-white flex flex-col items-center justify-center p-8 font-sans relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent-blue/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 text-center max-w-4xl">
        {notice && (
          <div className="mb-8 max-w-lg mx-auto bg-accent-red/10 border border-accent-red/40 rounded-xl px-4 py-3">
            <p className="text-accent-red text-xs font-bold uppercase tracking-widest">{notice}</p>
          </div>
        )}
        <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter leading-none uppercase mb-4 animate-pulse">
          Who Wants To Be <br />
          <span className="text-accent-blue">Financially Free?</span>
        </h1>
        <p className="text-gray-500 text-sm font-bold uppercase tracking-[0.5em] mb-16">
          The Ultimate High-Stakes Finance Simulator
        </p>

        <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl mx-auto">
          <button 
            onClick={() => navigate('/join')}
            className="flex-1 bg-white text-black py-6 rounded-2xl font-black text-2xl italic tracking-tighter hover:scale-105 active:scale-95 transition-all shadow-2xl cursor-pointer"
          >
            JOIN GAME
          </button>
          <button 
            onClick={hostGame}
            className="flex-1 bg-card-bg border-2 border-gray-800 text-white py-6 rounded-2xl font-black text-2xl italic tracking-tighter hover:border-accent-blue transition-all cursor-pointer"
          >
            HOST GAME
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate("/watch")}
          className="mt-6 text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 hover:text-accent-blue transition"
        >
          Watch a room (spectator)
        </button>
      </div>

      <p className="absolute bottom-8 text-gray-700 text-[10px] font-black uppercase tracking-[1em]">
        By Samuel Chukwunonso Ejiofor 
      </p>
    </div>
  );
};
