import { formatTimeoutLabel } from "./hooks/useTurnTimer";

export const GameHud = ({
  isHousingSetup,
  round,
  totalRounds,
  currentPlayerName,
  formattedTime,
  secondsLeft,
  showTimer,
  turnTimeoutSeconds,
  connected,
  turnBrief,
  turnOwnerLabel,
  isMyTurn,
  isSpectator,
  showBriefing,
}) => (
  <div className="w-full min-w-0 max-w-full lg:max-w-sm mx-auto text-center flex flex-col items-center shrink-0">
    <h1 className="text-[9px] sm:text-[10px] font-black text-gray-700 tracking-[0.35em] sm:tracking-[0.5em] uppercase shrink-0">
      {isHousingSetup ? "PRE-GAME SETUP" : `Round ${round} / ${totalRounds}`}
    </h1>

    <div className="shrink-0 flex flex-col justify-center w-full">
      {showTimer && (
        <>
          <p className="text-accent-blue text-[11px] sm:text-xs font-bold truncate px-1">
            {currentPlayerName}: {formattedTime}
            {secondsLeft <= 3 && secondsLeft > 0 && (
              <span className="text-accent-red ml-1 sm:ml-2 animate-pulse">HURRY!</span>
            )}
          </p>
          <p className="text-[8px] text-gray-600 uppercase tracking-widest">
            {formatTimeoutLabel(turnTimeoutSeconds)} limit per turn
          </p>
        </>
      )}
    </div>

    <p
      className={`text-[8px] uppercase tracking-widest shrink-0 ${
        connected ? "text-accent-green" : "text-accent-red"
      }`}
    >
      {connected ? "Live" : "Reconnecting…"}
    </p>

    <div className="w-full mt-1.5 sm:mt-2 px-2 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-gray-800/80 bg-black/40 shrink-0">
      {showBriefing && turnBrief ? (
        <>
          <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.12em] text-accent-blue mb-0.5">
            {turnBrief.title}
          </p>
          <p className="text-gray-400 text-[9px] sm:text-[10px] leading-snug line-clamp-2">
            {turnBrief.description}
          </p>
          <p
            className={`text-[8px] font-black uppercase tracking-widest mt-1 truncate ${
              isMyTurn && !isSpectator ? "text-naira-gold" : "text-gray-600"
            }`}
          >
            {turnOwnerLabel}
          </p>
        </>
      ) : null}
    </div>
  </div>
);
