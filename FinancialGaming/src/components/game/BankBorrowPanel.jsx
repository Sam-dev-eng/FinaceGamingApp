import { useEffect, useState } from "react";
import { MIN_CREDIT_SCORE_TO_BORROW } from "../../game/gameConstants";

export const BankBorrowPanel = ({
  creditScore = 500,
  currentCash = 0,
  currentLoan = 0,
  disabled = false,
  suggestedAmount = null,
  onBorrow,
  compact = false,
  collapsible = false,
}) => {
  const [borrowAmount, setBorrowAmount] = useState("");
  const [borrowError, setBorrowError] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const canBorrow = creditScore > MIN_CREDIT_SCORE_TO_BORROW && !disabled;

  useEffect(() => {
    if (!collapsible) return;
    setIsOpen(false);
    setBorrowAmount("");
    setBorrowError("");
  }, [collapsible, disabled]);

  const handleBorrow = () => {
    const amount = Number(borrowAmount);
    if (!amount || amount <= 0) {
      setBorrowError("Enter an amount greater than zero.");
      return;
    }
    setBorrowError("");
    onBorrow?.(amount);
    setBorrowAmount("");
    if (collapsible) setIsOpen(false);
  };

  const fillSuggested = () => {
    if (suggestedAmount != null && suggestedAmount > 0) {
      setBorrowAmount(String(suggestedAmount));
      setBorrowError("");
    }
  };

  const closeForm = () => {
    setIsOpen(false);
    setBorrowAmount("");
    setBorrowError("");
  };

  if (collapsible && !isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        className={`w-full rounded-xl border border-gray-700 bg-black/40 px-3 py-2 text-left transition-all ${
          disabled
            ? "opacity-70 cursor-not-allowed"
            : "hover:border-naira-gold/50 cursor-pointer"
        }`}
      >
        <p className="text-[9px] font-black uppercase tracking-widest text-naira-gold">
          🏦 Borrow from Bank
        </p>
        <p
          className={`text-[8px] font-black uppercase tracking-wider mt-0.5 ${
            creditScore > MIN_CREDIT_SCORE_TO_BORROW ? "text-accent-green" : "text-accent-red"
          }`}
        >
          Credit {creditScore}
          {!canBorrow && ` · need > ${MIN_CREDIT_SCORE_TO_BORROW}`}
        </p>
      </button>
    );
  }

  return (
    <div
      className={`rounded-xl border border-gray-700 bg-black/40 ${
        compact || collapsible ? "p-2.5 space-y-2" : "p-4 space-y-3"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">
          🏦 Bank
        </p>
        <p
          className={`text-[9px] font-black uppercase tracking-widest ${
            creditScore > MIN_CREDIT_SCORE_TO_BORROW ? "text-accent-green" : "text-accent-red"
          }`}
        >
          Credit {creditScore}
        </p>
      </div>

      {!canBorrow && (
        <p className="text-[9px] text-accent-red font-bold uppercase tracking-wide">
          Credit must be above {MIN_CREDIT_SCORE_TO_BORROW} to borrow.
        </p>
      )}

      {suggestedAmount != null && suggestedAmount > 0 && canBorrow && (
        <p className="text-[9px] text-gray-400">
          Short by ₦{suggestedAmount.toLocaleString()} —{" "}
          <button
            type="button"
            onClick={fillSuggested}
            className="text-accent-blue font-black uppercase tracking-wider hover:underline"
          >
            borrow exact amount
          </button>
        </p>
      )}

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-naira-gold font-mono font-bold text-sm">
          ₦
        </span>
        <input
          type="number"
          min="1"
          value={borrowAmount}
          onChange={(e) => {
            setBorrowAmount(e.target.value);
            setBorrowError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && canBorrow && handleBorrow()}
          placeholder="Borrow amount"
          disabled={!canBorrow}
          autoFocus={collapsible}
          className="w-full bg-black/40 border border-gray-800 py-2 pl-8 pr-3 rounded-lg font-mono text-sm focus:border-accent-blue outline-none transition disabled:opacity-50"
        />
      </div>

      {borrowError && (
        <p className="text-accent-red text-[9px] font-bold uppercase tracking-wide">
          {borrowError}
        </p>
      )}

      <button
        type="button"
        onClick={handleBorrow}
        disabled={!canBorrow || !borrowAmount}
        className={`w-full py-2 rounded-lg text-[9px] font-black transition-all ${
          canBorrow && borrowAmount
            ? "bg-naira-gold text-black hover:brightness-110 cursor-pointer"
            : "bg-gray-900 text-gray-700 cursor-not-allowed border border-gray-800"
        }`}
      >
        CONFIRM BORROW
      </button>

      {collapsible && (
        <button
          type="button"
          onClick={closeForm}
          className="w-full py-1 text-[9px] font-black text-gray-500 hover:text-gray-300"
        >
          Cancel
        </button>
      )}

      {!collapsible && (
        <p className="text-[8px] text-gray-600 uppercase tracking-wider text-center">
          Adds to cash & loan · Cash ₦{currentCash.toLocaleString()} · Loan ₦
          {currentLoan.toLocaleString()}
        </p>
      )}
    </div>
  );
};
