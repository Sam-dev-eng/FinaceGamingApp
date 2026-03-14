import { useState } from 'react';

export const PayLoanModal = ({ isOpen, onClose, currentLoan, onConfirm }) => {
  const [amount, setAmount] = useState('');

  if (!isOpen) return null;

  const handlePay = () => {
    const payAmount = parseInt(amount);
    if (!isNaN(payAmount) && payAmount > 0 && payAmount <= currentLoan) {
      // Logic for backend API
      console.log(`Sending to API: Payment of ₦${payAmount}`);
      onConfirm(payAmount); // Update local state
      setAmount('');
      onClose();
    } else {
      alert("Please enter a valid amount within your loan balance.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
      <div className="bg-card-bg w-full max-w-md rounded-[2.5rem] border border-gray-800 p-10 shadow-2xl animate-in fade-in zoom-in duration-300">
        
        <div className="text-center mb-8">
          <div className="text-accent-blue text-4xl mb-4">💳</div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter">Loan Repayment</h2>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
            Remaining Balance: <span className="text-naira-gold">₦{currentLoan.toLocaleString()}</span>
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block mb-2">
              Enter Amount to Pay
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-naira-gold font-mono font-bold">₦</span>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-black/40 border border-gray-800 p-4 pl-10 rounded-xl font-mono text-xl focus:border-accent-blue outline-none transition"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={onClose}
              className="flex-1 bg-gray-800 text-gray-400 py-4 rounded-xl font-black text-xs uppercase hover:bg-gray-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button 
              onClick={handlePay}
              className="flex-1 bg-accent-blue text-white py-4 rounded-xl font-black text-xs uppercase hover:brightness-110 shadow-lg shadow-accent-blue/20 transition cursor-pointer"
            >
              Confirm Pay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
