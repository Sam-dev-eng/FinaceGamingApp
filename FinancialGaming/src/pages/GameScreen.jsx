import { Sidebar } from "../components/game/SideBar";
import { OpponentCard } from "../components/game/OpponentCard";
import { useTurnTimer } from "../components/game/hooks/useTurnTimer";
import { PHASES, GAME_STAGES, isSimultaneousPhase } from "../components/game/utils/phase";
import { useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router";
import { resolveSession, saveGameSession, isSpectatorSession } from "../shared/session/gameSessionStorage";
import { EventArea } from "../components/game/EventArea";
import { GameHud } from "../components/game/GameHud";
import { PlayerFooter } from "../components/game/PlayerFooter";
import { SpectatorLiveFeed } from "../components/game/SpectatorLiveFeed";
import { HousingModal } from "../components/game/HousingModel";
import { RoundStartModal } from "../components/game/RoundStartModal";
import { rankPlayersByNetWorth, playerRequiresRentDice, calculateRoundRent } from "../game/gameCalculations";
import { SURVIVAL_COST, getMinimumLoanPayment } from "../game/gameConstants";
import { getTurnPhaseBrief } from "../game/roundDetails";
import { useServerGame } from "../hooks/useServerGame";

export const GameScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const session = resolveSession(location.state ?? {});
  const gameId = session.gameId;
  const playerId = session.playerId;
  const isSpectator = isSpectatorSession(session);

  useEffect(() => {
    if (gameId && playerId) {
      saveGameSession(session);
    }
  }, [gameId, playerId, session]);

  const {
    gameState,
    finalResults,
    connected,
    error,
    loading,
    selectHousing,
    paySurvival,
    payLoan,
    skipLoan,
    borrowFromBank,
    rollDice,
    dismissRoundStart,
  } = useServerGame(gameId, playerId, { readOnly: isSpectator });

  useEffect(() => {
    if (!gameId || !playerId) {
      navigate("/lobby", { state: { mode: "host", playerName: "YOU" } });
    }
  }, [gameId, playerId, navigate]);

  const players = gameState?.players ?? [];
  const myPlayer = useMemo(
    () =>
      isSpectator
        ? players[0]
        : players.find((p) => p.id === playerId) ?? players[0],
    [players, playerId, isSpectator]
  );
  const opponents = useMemo(
    () =>
      isSpectator
        ? [...players].sort((a, b) => (a.seatIndex ?? 0) - (b.seatIndex ?? 0))
        : players
            .filter((p) => p.id !== playerId)
            .sort((a, b) => (a.seatIndex ?? 0) - (b.seatIndex ?? 0)),
    [players, playerId, isSpectator]
  );

  const gameStage = gameState?.gameStage ?? GAME_STAGES.HOUSING;
  const round = gameState?.round ?? 1;
  const phase = gameState?.phase ?? PHASES.SURVIVAL;
  const turnIndex = gameState?.turnIndex ?? 0;
  const mySeatIndex = gameState?.mySeatIndex ?? 0;
  const lastEventMessage = gameState?.lastEventMessage;
  const isRoundStartOpen = gameState?.isRoundStartOpen ?? false;
  const roundStartSummary = gameState?.roundStartSummary ?? [];
  const isResolvingSimultaneous = gameState?.isResolvingSimultaneous ?? false;
  const simultaneousUpdates = gameState?.simultaneousUpdates ?? [];
  const isDiceSettling = gameState?.isDiceSettling ?? false;
  const totalRounds = gameState?.totalRounds ?? 4;
  const turnTimeoutSeconds = gameState?.turnTimeoutSeconds ?? 10;
  const turnDeadlineEpochMs = gameState?.turnDeadlineEpochMs ?? null;
  const phaseDeadlineEpochMs = gameState?.phaseDeadlineEpochMs ?? null;

  const isHousingSetup = gameStage === GAME_STAGES.HOUSING;
  const isGameComplete = gameStage === GAME_STAGES.COMPLETE;
  const isSimultaneous = isResolvingSimultaneous || isSimultaneousPhase(phase);
  const isInteractivePhase =
    isHousingSetup ||
    (gameStage === GAME_STAGES.PLAYING &&
      !isSimultaneous &&
      !isRoundStartOpen &&
      [PHASES.SURVIVAL, PHASES.LOAN, PHASES.DICE].includes(phase));

  const currentPlayer = players[turnIndex] ?? myPlayer;
  const isMyTurn = !isSpectator && turnIndex === mySeatIndex;
  const needsHousingChoice =
    isHousingSetup && isMyTurn && !myPlayer?.rentType;

  const turnTimerKey = isHousingSetup
    ? `setup-${turnIndex}`
    : isRoundStartOpen
      ? `${round}-${phase}-${turnIndex}-briefing`
      : `${round}-${phase}-${turnIndex}`;

  const { formattedTime, secondsLeft } = useTurnTimer(
    turnDeadlineEpochMs,
    isInteractivePhase && !isDiceSettling && Boolean(turnDeadlineEpochMs),
    turnTimerKey
  );

  useEffect(() => {
    if (!isGameComplete && !finalResults) return;

    navigate("/summary", {
      state: {
        gameResults:
          finalResults ?? {
            gameId,
            totalRounds,
            currentPlayerId: playerId,
            players: rankPlayersByNetWorth(players),
          },
      },
    });
  }, [isGameComplete, finalResults, navigate, gameId, totalRounds, playerId, players]);

  const handleHousingConfirm = (choice) => {
    selectHousing(choice.id);
  };

  const handlePaySurvival = (rentDiceRoll = null) => {
    paySurvival(rentDiceRoll);
  };

  const handleLoanPaymentConfirm = (amountPaid) => {
    payLoan(amountPaid);
  };

  const handleSkipLoan = () => {
    skipLoan();
  };

  const handleBorrowFromBank = (amount) => {
    borrowFromBank(amount);
  };

  const handleDiceRollComplete = (diceValue) => {
    rollDice(diceValue);
  };

  const isDicePhase = phase === PHASES.DICE;
  const isSurvivalPhase = phase === PHASES.SURVIVAL;
  const isLoanPhase = phase === PHASES.LOAN;
  const isCurrentTurnPhase =
    !isHousingSetup && !isSimultaneous && !isRoundStartOpen;
  const isMyDiceTurn =
    isDicePhase && (isSpectator ? isCurrentTurnPhase : isMyTurn && isCurrentTurnPhase);
  const isMySurvivalTurn =
    isSurvivalPhase && (isSpectator ? isCurrentTurnPhase : isMyTurn && isCurrentTurnPhase);
  const isMyParentsRentTurn =
    isMySurvivalTurn && playerRequiresRentDice(isSpectator ? currentPlayer : myPlayer);
  const isMyFixedRentSurvivalTurn =
    isMySurvivalTurn &&
    !playerRequiresRentDice(isSpectator ? currentPlayer : currentPlayer);
  const isMyLoanTurn =
    isLoanPhase && (isSpectator ? isCurrentTurnPhase : isMyTurn && isCurrentTurnPhase);

  const getEventTitle = () => {
    if (isHousingSetup) return "HOUSING DECISION";

    switch (phase) {
      case PHASES.SURVIVAL:
        return "SURVIVAL + RENT";
      case PHASES.LOAN:
        return "STUDENT LOAN PAYMENT";
      case PHASES.DICE:
        return "UNCERTAINTY EVENT";
      case PHASES.NETWORTH:
        return "NET WORTH UPDATE";
      default:
        return "";
    }
  };

  const getEventDesc = () => {
    if (isHousingSetup) {
      return isMyTurn
        ? "Choose where to live — this decision is locked for the entire game."
        : "Waiting for all players to choose housing before Round 1 begins.";
    }

    switch (phase) {
      case PHASES.SURVIVAL:
        return playerRequiresRentDice(myPlayer)
          ? "Roll the dice to calculate your rent (2% inflation per pip), then pay survival + rent."
          : `Pay survival (₦${SURVIVAL_COST.toLocaleString()}) plus your round rent.`;
      case PHASES.LOAN:
        return `Loan payment is optional. Recommended minimum ₦${getMinimumLoanPayment(round).toLocaleString()} — skipping hurts your credit score. 10% interest applies after each round.`;
      case PHASES.DICE:
        return "Roll the dice to reveal an uncertainty event.";
      case PHASES.NETWORTH:
        return "10% loan interest is being applied to all remaining balances.";
      default:
        return "";
    }
  };

  const estimatedSurvivalTotal =
    isMyFixedRentSurvivalTurn && myPlayer?.rentType
      ? SURVIVAL_COST + calculateRoundRent(myPlayer, round)
      : null;
  const survivalShortfall =
    estimatedSurvivalTotal != null && myPlayer
      ? Math.max(0, estimatedSurvivalTotal - myPlayer.cash)
      : null;

  const bankAvailable =
    !isSpectator &&
    gameStage === GAME_STAGES.PLAYING &&
    isMyTurn &&
    !isSimultaneous &&
    !isRoundStartOpen &&
    !isDiceSettling;

  const turnBrief = getTurnPhaseBrief({
    phase,
    round,
    isHousingSetup,
    isSimultaneous,
    requiresRentDice: playerRequiresRentDice(currentPlayer),
    minLoanPayment: getMinimumLoanPayment(round),
    survivalCost: SURVIVAL_COST,
  });

  const turnOwnerLabel = isSimultaneous
    ? "All players"
    : isSpectator
      ? `${currentPlayer?.name ?? "Player"}'s turn`
      : isMyTurn
        ? "Your turn"
        : `${currentPlayer?.name ?? "Opponent"}'s turn`;

  const visualPhase = useMemo(() => {
    if (isSimultaneous) return "simultaneous";
    if (isHousingSetup) return "housing";
    switch (phase) {
      case PHASES.SURVIVAL:
        return "survival";
      case PHASES.LOAN:
        return "loan";
      case PHASES.DICE:
        return "dice";
      case PHASES.NETWORTH:
        return "networth";
      default:
        return "neutral";
    }
  }, [isSimultaneous, isHousingSetup, phase]);

  const eventRollKey = `${round}-${phase}-${turnIndex}`;

  const roomCode = gameState?.roomCode ?? session.roomCode ?? "—";

  const playerTurnIndex = (player) =>
    player ? players.findIndex((p) => p.id === player.id) : -1;

  const playerStatus = (player) => {
    if (!player) return "WAITING";
    const idx = playerTurnIndex(player);
    if (isHousingSetup) {
      return turnIndex === idx ? "CHOOSING HOME" : "WAITING";
    }
    if (isSimultaneous) return "UPDATING";
    return turnIndex === idx ? "TAKING TURN" : "WAITING";
  };

  const isPlayerTurn = (player) => {
    if (!player) return false;
    const idx = playerTurnIndex(player);
    return isHousingSetup ? turnIndex === idx : isSimultaneous || turnIndex === idx;
  };

  const renderOpponentCard = (player) => (
    <OpponentCard
      name={player.name}
      netWorth={player.cash - player.loan}
      cash={player.cash}
      loan={player.loan}
      creditScore={player.creditScore}
      status={playerStatus(player)}
      isTakingTurn={isPlayerTurn(player)}
    />
  );

  const hudProps = {
    isHousingSetup,
    round,
    totalRounds,
    currentPlayerName: currentPlayer?.name ?? "—",
    formattedTime,
    secondsLeft,
    showTimer: isInteractivePhase && Boolean(turnDeadlineEpochMs),
    turnTimeoutSeconds,
    connected,
    turnBrief,
    turnOwnerLabel,
    isMyTurn,
    isSpectator,
    showBriefing: !isRoundStartOpen && gameStage !== GAME_STAGES.COMPLETE,
  };

  if (loading || !gameState || !myPlayer || !connected) {
    return (
      <div className="min-h-screen bg-game-bg text-white flex flex-col items-center justify-center font-sans gap-4">
        <div className="text-accent-blue text-5xl animate-pulse">💠</div>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-500">
          {loading ? "Loading game…" : connected ? "Syncing game state…" : "Connecting to server…"}
        </p>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-game-bg text-white flex flex-col md:flex-row overflow-hidden font-sans">
      <RoundStartModal
        round={round}
        players={roundStartSummary}
        isOpen={isRoundStartOpen && gameStage === GAME_STAGES.PLAYING && !isSpectator}
        onContinue={dismissRoundStart}
        phaseDeadlineEpochMs={phaseDeadlineEpochMs}
      />

      <HousingModal
        isOpen={needsHousingChoice}
        onConfirm={handleHousingConfirm}
      />

      <Sidebar round={round} totalRounds={totalRounds} />

      <div className="flex-grow flex flex-col min-h-0 min-w-0 p-2 sm:p-3 md:p-4 gap-1.5 sm:gap-2 max-w-7xl mx-auto w-full overflow-hidden safe-area-bottom">
        {/* Status bar */}
        <header className="shrink-0 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-0.5 sm:px-1">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-gray-600 shrink-0">
              Room
            </span>
            <span className="font-mono text-[11px] sm:text-xs font-bold text-naira-gold truncate">
              {roomCode}
            </span>
            <span className="md:hidden text-[8px] font-black uppercase tracking-wider text-gray-600 shrink-0">
              · R{round}/{totalRounds}
            </span>
            {isSpectator && (
              <span className="text-[8px] font-black uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-accent-blue/15 text-accent-blue border border-accent-blue/30 shrink-0">
                Spectator
              </span>
            )}
          </div>
          <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-gray-600 text-right shrink-0 max-w-[50%] truncate">
            {isHousingSetup ? "Housing" : getEventTitle().replace(/_/g, " ")}
          </p>
        </header>

        {error && (
          <div className="shrink-0 bg-accent-red/10 border border-accent-red/40 rounded-xl px-3 py-2 text-center">
            <p className="text-accent-red text-[10px] font-bold uppercase tracking-widest">
              {error}
            </p>
          </div>
        )}

        {/* Top: players + HUD */}
        {isSpectator ? (
          <div className="flex-1 min-h-0 flex flex-col gap-2 sm:gap-3">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 shrink-0">
              {players.map((player) => (
                <div key={player.id} className="min-w-0">{renderOpponentCard(player)}</div>
              ))}
            </div>
            <div className="shrink-0 flex justify-center">
              <GameHud {...hudProps} />
            </div>
            <SpectatorLiveFeed
              lastEventMessage={lastEventMessage}
              simultaneousUpdates={simultaneousUpdates}
              isSimultaneous={isSimultaneous}
            />
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col gap-1.5 sm:gap-2 overflow-hidden">
          <div className="shrink-0 grid grid-cols-2 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)_minmax(0,16rem)] gap-2 sm:gap-3 lg:gap-4 auto-rows-min">
            <div className="min-w-0 order-2 lg:order-none lg:col-start-1 lg:row-start-1">
              {opponents[0] && renderOpponentCard(opponents[0])}
            </div>
            <div className="col-span-2 order-1 lg:order-none lg:col-span-1 lg:col-start-2 lg:row-start-1 min-w-0">
              <GameHud {...hudProps} />
            </div>
            <div className="min-w-0 order-3 lg:order-none lg:col-start-3 lg:row-start-1">
              {opponents[1] && renderOpponentCard(opponents[1])}
            </div>
          </div>

        {/* Event area — scrollable so action buttons stay reachable */}
        <section className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-xl sm:rounded-2xl border border-gray-800/60 bg-black/20">
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col p-1 sm:p-1.5">
            <EventArea
              eventTitle={getEventTitle()}
              eventDesc={getEventDesc()}
              visualPhase={visualPhase}
              isActive={isSimultaneous || isMyTurn}
              isSimultaneous={isSimultaneous}
              showDice={isMyDiceTurn}
              showSurvival={isMyFixedRentSurvivalTurn}
              showRentDice={isMyParentsRentTurn}
              showLoan={isMyLoanTurn}
              survivalCost={SURVIVAL_COST}
              currentLoan={currentPlayer?.loan ?? 0}
              currentCash={currentPlayer?.cash ?? 0}
              creditScore={myPlayer?.creditScore ?? 500}
              minLoanPayment={getMinimumLoanPayment(round)}
              survivalShortfall={survivalShortfall}
              estimatedSurvivalTotal={estimatedSurvivalTotal}
              onPaySurvival={handlePaySurvival}
              onPayLoan={handleLoanPaymentConfirm}
              onSkipLoan={handleSkipLoan}
              onRollComplete={handleDiceRollComplete}
              lastEventMessage={lastEventMessage}
              balanceUpdates={simultaneousUpdates}
              rollKey={eventRollKey}
            />
          </div>
        </section>

        <PlayerFooter
          myPlayer={myPlayer}
          isMyTurn={isMyTurn}
          bankAvailable={bankAvailable}
          survivalShortfall={survivalShortfall}
          onBorrow={handleBorrowFromBank}
        />
          </div>
        )}
      </div>
    </div>
  );
};
