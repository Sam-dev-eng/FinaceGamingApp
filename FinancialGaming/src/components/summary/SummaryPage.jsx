import { useNavigate } from 'react-router';
import { ResultRow } from '../../components/summary/ResultRow';
import { LedgerRow } from '../../components/summary/LedgerRow';

export const SummaryPage = () => {
  const navigate = useNavigate();

  // Mock data for the final state
  const finalResults = [
    { rank: 1, name: "YOU", netWorth: "3,800,000", isMain: true },
    { rank: 2, name: "OPPONENT B", netWorth: "2,100,000", isMain: false },
    { rank: 3, name: "OPPONENT A", netWorth: "1,400,000", isMain: false }
  ];

  const roundHistory = [
    { round: 1, income: "3,400,000", eventName: "Job Loss!", eventCost: "200,000" },
    { round: 2, income: "800,000", eventName: "Rent Paid", eventCost: "600,000" },
    { round: 3, income: "800,000", eventName: "Rent Paid", eventCost: "600,000" },
    { round: 4, income: "800,000", eventName: null, eventCost: null }
  ];

  return (
    <div className="min-h-screen bg-game-bg text-white flex flex-col items-center p-8 font-sans overflow-y-auto">
      <div className="w-full max-w-2xl mt-8">
        
        {/* Title Section */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black italic uppercase tracking-tighter scale-y-110 mb-2">
            Round 4 <span className="text-accent-blue">Summary</span> & Results
          </h1>
          <div className="h-1 w-20 bg-accent-blue mx-auto rounded-full"></div>
        </div>

        {/* SECTION 1: Top 3 Results */}
        <section className="mb-12">
          {finalResults.map(player => (
            <ResultRow key={player.rank} {...player} />
          ))}
        </section>

        {/* SECTION 2: Your Detailed Journey */}
        <section className="bg-card-bg/40 rounded-[2.5rem] p-8 border border-gray-800 shadow-2xl backdrop-blur-sm">
          <h2 className="text-sm font-black uppercase tracking-[0.4em] mb-8 text-center text-gray-400">
            Player Ledger - <span className="text-white">Your Journey</span>
          </h2>
          
          <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {roundHistory.map(round => (
              <LedgerRow key={round.round} {...round} />
            ))}
          </div>
          
          {/* Final Footer Calculation */}
          <div className="mt-8 p-6 bg-black/60 rounded-3xl flex justify-between items-center border border-accent-blue/30 shadow-inner">
            <div>
              <p className="text-[10px] font-black uppercase text-accent-blue tracking-widest">Total Final</p>
              <p className="text-lg font-black italic uppercase">Net Worth</p>
            </div>
            <span className="text-3xl font-mono text-naira-gold drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">
              ₦3,800,000
            </span>
          </div>
        </section>

        {/* Footer Actions */}
        <div className="flex flex-col gap-4 mt-12 mb-12">
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-white text-black py-5 rounded-2xl font-black text-xl italic tracking-tighter hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/5 cursor-pointer"
          >
            PLAY NEW GAME
          </button>
          <button className="text-[10px] font-black uppercase text-gray-600 tracking-[0.5em] hover:text-white transition">
            Export Financial Report (PDF)
          </button>
        </div>
      </div>
    </div>
  );
};
