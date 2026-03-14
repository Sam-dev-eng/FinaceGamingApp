import { useState } from 'react';
import { useNavigate } from 'react-router';

export const JoinPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ code: '', password: '' });
  const [error , setError] = useState(false);

  const handleJoin = ()=>{
        if(formData.code.toUpperCase() === "samuel" && formData.password == "1234"){
            setError(false);
            navigate("/lobby")
        } else{
            setError(true);
        }  
  }

  return (
    <div className="min-h-screen bg-game-bg text-white flex flex-col items-center justify-center p-8 font-sans">
      <div className="w-full max-w-md bg-card-bg p-10 rounded-[2.5rem] border border-gray-800 shadow-2xl">
        {error && (
          <div className="absolute top-0 left-0 w-full bg-accent-red/20 border-b border-accent-red p-3 flex items-center justify-center gap-2 animate-bounce">
            <span className="text-accent-red text-[10px] font-black uppercase tracking-[0.2em]">
              ⚠️ Incorrect Game Code or Password
            </span>
          </div>
        )}
        <button onClick={() => navigate(-1)} className="text-gray-500 text-xs font-black uppercase tracking-widest mb-8 hover:text-white transition cursor-pointer">
          ← Back
        </button>

        <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Join Lobby</h2>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-8">Enter your access credentials</p>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-black uppercase text-accent-blue tracking-widest block mb-2">Game Room Code</label>
            <input 
              type="text" 
              placeholder="E.G. BXT-452"
              className="w-full bg-black/40 border border-gray-800 p-4 rounded-xl font-mono text-xl tracking-widest focus:border-accent-blue outline-none transition uppercase"
              onChange={(e) => setFormData({...formData, code: e.target.value})}
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-accent-blue tracking-widest block mb-2">Room Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              className="w-full bg-black/40 border border-gray-800 p-4 rounded-xl font-mono text-xl tracking-widest focus:border-accent-blue outline-none transition"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button 
            onClick={handleJoin}
            className="w-full bg-accent-blue text-white py-5 rounded-xl font-black text-xl italic tracking-tighter hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-accent-blue/20 mt-4 cursor-pointer"
          >
            ENTER FRENZY
          </button>
        </div>
      </div>
    </div>
  );
};
