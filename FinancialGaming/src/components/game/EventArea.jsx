import { useEffect, useState } from "react";
import { calculateParentsRent } from "../../game/gameCalculations";
import { HOUSING_OPTIONS } from "../../game/gameConstants";

export const EventArea = ({
  eventTitle,
  eventDesc,
  visualPhase = "neutral",
  isActive,
  isSimultaneous = false,
  showDice = false,
  showSurvival = false,
  showRentDice = false,
  showLoan = false,
  survivalCost = 0,
  currentLoan = 0,
  currentCash = 0,
  minLoanPayment = 0,
  onRollComplete,
  onPaySurvival,
  onPayLoan,
  onSkipLoan,
  survivalShortfall = null,
  estimatedSurvivalTotal = null,
  lastEventMessage,
  rollKey,
  balanceUpdates = [],
}) => {
  const [diceValue, setDiceValue] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [hasRolled, setHasRolled] = useState(false);
  const [loanAmount, setLoanAmount] = useState("");
  const [loanError, setLoanError] = useState("");
  const [rentDiceRoll, setRentDiceRoll] = useState(null);
  const [isRentRolling, setIsRentRolling] = useState(false);
  const [loanFormOpen, setLoanFormOpen] = useState(false);

  useEffect(() => {
    setHasRolled(false);
    setDiceValue(1);
    setIsRolling(false);
    setLoanAmount("");
    setLoanError("");
    setRentDiceRoll(null);
    setIsRentRolling(false);
    setLoanFormOpen(false);
  }, [rollKey]);

  // Fresh rent dice each survival turn (e.g. after round-start briefing closes)
  useEffect(() => {
    if (!showRentDice) return;
    setRentDiceRoll(null);
    setIsRentRolling(false);
    setDiceValue(1);
  }, [showRentDice, rollKey]);

  const rollDice = () => {
    if (isRolling || !isActive || !showDice || hasRolled) return;

    setIsRolling(true);
    setHasRolled(true);

    const rollInterval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
    }, 100);

    setTimeout(() => {
      clearInterval(rollInterval);

      const finalValue = Math.floor(Math.random() * 6) + 1;
      setDiceValue(finalValue);
      setIsRolling(false);
      onRollComplete?.(finalValue);
    }, 1000);
  };

  const diceFaces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

  const rollRentDice = () => {
    if (isRentRolling || !isActive || !showRentDice || rentDiceRoll != null) return;

    setIsRentRolling(true);

    const rollInterval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
    }, 100);

    setTimeout(() => {
      clearInterval(rollInterval);
      const finalValue = Math.floor(Math.random() * 6) + 1;
      setDiceValue(finalValue);
      setRentDiceRoll(finalValue);
      setIsRentRolling(false);
    }, 1000);
  };

  const calculatedParentsRent =
    rentDiceRoll != null ? calculateParentsRent(rentDiceRoll) : null;
  const parentsBaseRent = HOUSING_OPTIONS.PARENTS.baseCost;

  const canRollRent = showRentDice && isActive && rentDiceRoll == null && !isRentRolling;
  const canPayParentsSurvival =
    showRentDice && isActive && rentDiceRoll != null && !isRentRolling;

  const handleLoanSubmit = () => {
    const payAmount = Number(loanAmount);
    const maxPay = Math.min(currentLoan, currentCash);

    if (!payAmount || payAmount <= 0) {
      setLoanError("Enter an amount greater than zero.");
      return;
    }
    if (payAmount > currentLoan) {
      setLoanError(`Cannot exceed loan balance (₦${currentLoan.toLocaleString()}).`);
      return;
    }
    if (payAmount > currentCash) {
      setLoanError(`Insufficient cash (₦${currentCash.toLocaleString()} available).`);
      return;
    }
    if (payAmount > maxPay) {
      setLoanError("Amount exceeds what you can pay this round.");
      return;
    }

    setLoanError("");
    onPayLoan?.(payAmount);
    setLoanAmount("");
    setLoanFormOpen(false);
  };

  const handleSkipLoan = () => {
    setLoanError("");
    onSkipLoan?.();
  };

  const canRoll = showDice && isActive && !hasRolled && !isRolling;
  const canPaySurvival = showSurvival && isActive;
  const canPayLoan = showLoan && isActive && currentLoan > 0 && currentCash > 0;
  const canSkipLoan = showLoan && isActive;

  const isInteractive =
    showDice || showSurvival || showLoan || showRentDice;

  const phaseAccentClass =
    isSimultaneous || visualPhase === "simultaneous"
      ? "text-accent-blue"
      : showDice || showRentDice || visualPhase === "dice"
        ? "text-naira-gold"
        : showSurvival || visualPhase === "survival"
          ? "text-accent-red"
          : showLoan || visualPhase === "loan"
            ? "text-accent-blue"
            : "text-gray-500";

  const renderPhaseIcon = () => {
    if (showDice || (visualPhase === "dice" && !showRentDice)) {
      return showDice ? diceFaces[diceValue - 1] : "🎲";
    }
    if (showRentDice) {
      return diceFaces[diceValue - 1];
    }
    switch (visualPhase) {
      case "survival":
        return "🛒";
      case "loan":
        return "💳";
      case "dice":
        return "🎲";
      case "simultaneous":
        return "📊";
      case "housing":
        return "🏠";
      case "networth":
        return "📈";
      default:
        return "⏳";
    }
  };

  const statusLabel = isSimultaneous
    ? "All Players — Simultaneous"
    : showRentDice
      ? rentDiceRoll != null
        ? "Your Turn — Confirm Payment"
        : "Your Turn — Roll for Rent"
      : showDice
        ? "Your Turn — Roll the Dice"
        : showSurvival
          ? "Your Turn — Pay Survival"
          : showLoan
            ? "Your Turn — Pay Student Loan"
            : isActive
              ? "Incoming Event"
              : "Waiting for Turn";

  return (
    <div
      className={`bg-card-bg/20 rounded-xl sm:rounded-2xl border border-gray-800/50 flex flex-col items-center relative backdrop-blur-sm w-full min-h-min py-1.5 sm:py-2 px-2 pb-3 ${
        isSimultaneous ? "ring-2 ring-accent-blue/20" : ""
      } ${visualPhase === "dice" || showDice || showRentDice ? "ring-1 ring-naira-gold/20" : ""} ${visualPhase === "survival" || showSurvival ? "ring-1 ring-accent-red/20" : ""} ${visualPhase === "loan" || showLoan ? "ring-1 ring-accent-blue/20" : ""}`}
    >
      <div className="flex gap-1.5 mb-1 shrink-0">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-1 h-1 rounded-full ${
              isActive || showDice
                ? isSimultaneous
                  ? "bg-accent-blue shadow-[0_0_8px_#3B82F6] animate-pulse"
                  : "bg-accent-blue shadow-[0_0_8px_#3B82F6]"
                : "bg-gray-800"
            }`}
          />
        ))}
      </div>

      <div className="text-center px-1 w-full max-w-md mx-auto flex flex-col">
        <div className="h-9 sm:h-11 md:h-12 flex items-center justify-center mb-1 shrink-0">
          <div
            className={`text-4xl sm:text-5xl md:text-6xl leading-none ${
              isRolling || isRentRolling ? "animate-spin scale-110 text-naira-gold" : "text-white"
            } ${visualPhase === "simultaneous" && isSimultaneous ? "animate-pulse" : ""}`}
          >
            {renderPhaseIcon()}
          </div>
        </div>

        <div className="bg-black/60 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-700 shadow-2xl flex flex-col">
          <p
            className={`text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-1 shrink-0 ${phaseAccentClass}`}
          >
            {statusLabel}
          </p>

          <h2 className="text-base sm:text-lg font-black mb-0.5 text-white shrink-0 leading-tight">
            {eventTitle}
          </h2>

          <p className="text-gray-400 text-[10px] sm:text-[11px] italic line-clamp-2 shrink-0">
            {eventDesc}
          </p>

          <div className="flex flex-col gap-2 mt-2 sm:mt-3">
            {isSimultaneous && balanceUpdates.length > 0 && (
              <div className="space-y-1.5 text-left overflow-hidden shrink-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-accent-blue text-center">
                  Balance Changes
                </p>
                {balanceUpdates.map((player) => (
                  <div
                    key={player.id}
                    className="rounded-lg border border-gray-800 bg-black/40 px-2 py-1.5"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-white truncate">
                        {player.name}
                      </span>
                      <span className="text-[9px] font-mono text-naira-gold shrink-0">
                        ₦{player.netWorth.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {lastEventMessage && (
              <p className="text-accent-blue text-[10px] sm:text-xs font-bold line-clamp-2 shrink-0">
                {lastEventMessage}
              </p>
            )}

            {showLoan && (
            <div className="space-y-2 text-left shrink-0">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">
                Remaining Loan:{" "}
                <span className="text-naira-gold">₦{currentLoan.toLocaleString()}</span>
              </p>

              {!loanFormOpen ? (
                <div className="space-y-2">
                  {minLoanPayment > 0 && currentLoan > 0 && (
                    <p className="text-[9px] text-gray-500 text-center">
                      Recommended min ₦{Math.min(minLoanPayment, currentLoan).toLocaleString()} · optional
                    </p>
                  )}
                  {currentLoan > 0 && (
                    <button
                      type="button"
                      onClick={() => canPayLoan && setLoanFormOpen(true)}
                      disabled={!canPayLoan}
                      className={`w-full py-2.5 rounded-full text-[10px] sm:text-xs font-black transition-all ${
                        canPayLoan
                          ? "bg-accent-blue text-white hover:brightness-110 cursor-pointer shadow-lg shadow-accent-blue/30"
                          : "bg-gray-900 text-gray-600 cursor-not-allowed border border-gray-800"
                      }`}
                    >
                      MAKE LOAN PAYMENT
                    </button>
                  )}
                  {!canPayLoan && currentLoan > 0 && currentCash <= 0 && (
                    <p className="text-[9px] text-gray-500 text-center">
                      No cash available — skip or borrow from the bank below
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleSkipLoan}
                    disabled={!canSkipLoan}
                    className={`w-full py-2.5 rounded-full text-[10px] sm:text-xs font-black transition-all ${
                      canSkipLoan
                        ? "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600 cursor-pointer"
                        : "bg-gray-900 text-gray-700 cursor-not-allowed border border-gray-800"
                    }`}
                  >
                    SKIP LOAN THIS ROUND
                  </button>
                  {currentLoan <= 0 && (
                    <p className="text-[9px] text-gray-500 text-center uppercase tracking-widest">
                      No loan balance — skip to continue
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest block">
                    Enter Amount to Pay
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-naira-gold font-mono font-bold text-sm">
                      ₦
                    </span>
                    <input
                      type="number"
                      min="1"
                      max={Math.min(currentLoan, currentCash)}
                      value={loanAmount}
                      onChange={(e) => {
                        setLoanAmount(e.target.value);
                        setLoanError("");
                      }}
                      onKeyDown={(e) => e.key === "Enter" && canPayLoan && handleLoanSubmit()}
                      placeholder="0"
                      disabled={!canPayLoan}
                      autoFocus
                      className="w-full bg-black/40 border border-gray-800 py-2.5 pl-8 pr-3 rounded-xl font-mono text-base focus:border-accent-blue outline-none transition disabled:opacity-50"
                    />
                  </div>
                  {loanError && (
                    <p className="text-accent-red text-[9px] font-bold uppercase tracking-wide">
                      {loanError}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleLoanSubmit}
                    disabled={!canPayLoan || !loanAmount}
                    className={`w-full py-2.5 rounded-full text-[10px] sm:text-xs font-black transition-all ${
                      canPayLoan && loanAmount
                        ? "bg-accent-blue text-white hover:brightness-110 cursor-pointer shadow-lg shadow-accent-blue/30"
                        : "bg-gray-900 text-gray-700 cursor-not-allowed border border-gray-800"
                    }`}
                  >
                    CONFIRM PAYMENT
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoanFormOpen(false);
                      setLoanAmount("");
                      setLoanError("");
                    }}
                    className="w-full py-2 rounded-full text-[10px] font-black text-gray-500 hover:text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSkipLoan}
                    disabled={!canSkipLoan}
                    className={`w-full py-2.5 rounded-full text-[10px] sm:text-xs font-black transition-all ${
                      canSkipLoan
                        ? "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600 cursor-pointer"
                        : "bg-gray-900 text-gray-700 cursor-not-allowed border border-gray-800"
                    }`}
                  >
                    SKIP LOAN THIS ROUND
                  </button>
                </div>
              )}
            </div>
          )}

          {showRentDice && (
            <div className="space-y-2 shrink-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">
                Base rent ₦{parentsBaseRent.toLocaleString()} · +2% per dice pip
              </p>
              {rentDiceRoll != null && calculatedParentsRent != null && (
                <p className="text-center text-naira-gold font-mono font-bold text-lg">
                  Rent this round: ₦{calculatedParentsRent.toLocaleString()}
                  <span className="block text-[10px] text-gray-500 font-sans font-black uppercase tracking-widest mt-1">
                    Rolled {rentDiceRoll}
                  </span>
                </p>
              )}
              {rentDiceRoll == null ? (
                <button
                  type="button"
                  onClick={rollRentDice}
                  disabled={!canRollRent}
                  className={`w-full px-6 py-2.5 rounded-full text-[10px] sm:text-xs font-black transition-all ${
                    canRollRent
                      ? "bg-white text-black hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-white/20"
                      : "bg-gray-900 text-gray-700 cursor-not-allowed border border-gray-800"
                  }`}
                >
                  {isRentRolling ? "ROLLING..." : "ROLL DICE FOR RENT"}
                </button>
              ) : (
                <>
                  {rentDiceRoll != null &&
                    calculatedParentsRent != null &&
                    currentCash < calculatedParentsRent + survivalCost && (
                      <p className="text-accent-red text-[10px] font-bold uppercase tracking-wide text-center">
                        Short ₦
                        {(
                          calculatedParentsRent +
                          survivalCost -
                          currentCash
                        ).toLocaleString()}{" "}
                        — use the bank panel below
                      </p>
                    )}
                  <button
                    type="button"
                    onClick={() => onPaySurvival?.(rentDiceRoll)}
                    disabled={
                      !canPayParentsSurvival ||
                      (calculatedParentsRent != null &&
                        currentCash < calculatedParentsRent + survivalCost)
                    }
                    className={`w-full px-6 py-2.5 rounded-full text-[10px] sm:text-xs font-black transition-all ${
                      canPayParentsSurvival &&
                      !(
                        calculatedParentsRent != null &&
                        currentCash < calculatedParentsRent + survivalCost
                      )
                        ? "bg-accent-red text-white hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-accent-red/30"
                        : "bg-gray-900 text-gray-700 cursor-not-allowed border border-gray-800"
                    }`}
                  >
                    PAY ₦{survivalCost.toLocaleString()} SURVIVAL + ₦
                    {calculatedParentsRent.toLocaleString()} RENT
                  </button>
                </>
              )}
            </div>
          )}

          {showSurvival && (
            <div className="space-y-2 shrink-0">
              {survivalShortfall != null && survivalShortfall > 0 && (
                <p className="text-accent-red text-[9px] font-bold uppercase tracking-wide text-center line-clamp-2">
                  Insufficient cash — borrow ₦{survivalShortfall.toLocaleString()} using the bank panel below first
                </p>
              )}
              {estimatedSurvivalTotal != null && (
                <p className="text-[9px] text-gray-500 text-center uppercase tracking-widest">
                  Total due: ₦{estimatedSurvivalTotal.toLocaleString()}
                </p>
              )}
              <button
                type="button"
                onClick={() => onPaySurvival?.()}
                disabled={!canPaySurvival || (survivalShortfall != null && survivalShortfall > 0)}
                className={`px-6 py-2.5 rounded-full text-[10px] sm:text-xs font-black transition-all ${
                  canPaySurvival && !(survivalShortfall != null && survivalShortfall > 0)
                    ? "bg-accent-red text-white hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-accent-red/30"
                    : "bg-gray-900 text-gray-700 cursor-not-allowed border border-gray-800"
                }`}
              >
                PAY ₦{survivalCost.toLocaleString()} SURVIVAL + RENT
              </button>
            </div>
          )}

          {showDice && (
            <button
              type="button"
              onClick={rollDice}
              disabled={!canRoll}
              className={`px-6 py-2.5 rounded-full text-[10px] sm:text-xs font-black transition-all shrink-0 ${
                canRoll
                  ? "bg-white text-black hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-white/20"
                  : hasRolled
                    ? "bg-gray-900 text-gray-500 cursor-not-allowed border border-gray-800"
                    : isRolling
                      ? "bg-gray-800 text-gray-500"
                      : "bg-gray-900 text-gray-700 cursor-not-allowed border border-gray-800"
              }`}
            >
              {isRolling ? "ROLLING..." : hasRolled ? "ROLLED" : "ROLL DICE"}
            </button>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};
