import { useCallback, useEffect, useRef, useState } from "react";
import {
  PHASES,
  GAME_STAGES,
  TOTAL_ROUNDS,
  STARTING_CASH,
  STARTING_LOAN,
  STARTING_CREDIT_SCORE,
  SALARY_PER_ROUND,
  SURVIVAL_COST,
  isSimultaneousPhase,
  NET_WORTH_PHASE_DURATION_MS,
  ROUND_START_DURATION_MS,
  DICE_RESULT_DELAY_MS,
} from "../../../game/gameConstants";
import {
  createPlayerState,
  applyDiceEvent,
  applyRoundStart,
  applyNetWorthPhase,
  applySurvivalTurn,
  applyLoanTurn,
  createPendingRound,
  buildRoundOneStartEvents,
  buildBalanceChangeSummary,
} from "../../../game/diceEventLogic";
import {
  getRandomHousingChoice,
  getRandomLoanPayment,
  getRandomDiceRoll,
} from "../../../game/autoPlay";
import { playerRequiresRentDice } from "../../../game/gameCalculations";

const INITIAL_PLAYERS = [
  { id: "player-1", name: "YOU", rentType: null },
  { id: "player-2", name: "Opponent A", rentType: null },
  { id: "player-3", name: "Opponent B", rentType: null },
];

const PLAYER_COUNT = 3;

export const useGameEngine = () => {
  const [gameStage, setGameStage] = useState(GAME_STAGES.HOUSING);
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState(PHASES.SURVIVAL);
  const [turnIndex, setTurnIndex] = useState(0);
  const [lastEventMessage, setLastEventMessage] = useState(null);
  const [isResolvingSimultaneous, setIsResolvingSimultaneous] = useState(false);
  const [isRoundStartOpen, setIsRoundStartOpen] = useState(false);
  const [roundStartSummary, setRoundStartSummary] = useState([]);
  const [simultaneousUpdates, setSimultaneousUpdates] = useState([]);
  const [isDiceSettling, setIsDiceSettling] = useState(false);

  const [players, setPlayers] = useState(
    INITIAL_PLAYERS.map((p) =>
      createPlayerState({
        ...p,
        cash: STARTING_CASH,
        loan: STARTING_LOAN,
        creditScore: STARTING_CREDIT_SCORE,
      })
    )
  );

  const turnIndexRef = useRef(turnIndex);
  const playersRef = useRef(players);
  const phaseRef = useRef(phase);
  const roundRef = useRef(round);
  const gameStageRef = useRef(gameStage);
  const isRoundStartOpenRef = useRef(isRoundStartOpen);
  const isResolvingSimultaneousRef = useRef(isResolvingSimultaneous);
  const isDiceSettlingRef = useRef(false);
  const diceAdvanceTimerRef = useRef(null);

  useEffect(() => {
    turnIndexRef.current = turnIndex;
    playersRef.current = players;
    phaseRef.current = phase;
    roundRef.current = round;
    gameStageRef.current = gameStage;
    isRoundStartOpenRef.current = isRoundStartOpen;
    isResolvingSimultaneousRef.current = isResolvingSimultaneous;
  }, [turnIndex, players, phase, round, gameStage, isRoundStartOpen, isResolvingSimultaneous]);

  const initRoundOne = useCallback(
    (currentPlayers) =>
      currentPlayers.map((player) => ({
        ...player,
        pendingRound: createPendingRound(1, { salary: SALARY_PER_ROUND }),
      })),
    []
  );

  const applyRoundStartToAll = useCallback(
    (currentPlayers, nextRound) =>
      currentPlayers.map((player) => {
        const salary = player.skipNextSalary ? 0 : SALARY_PER_ROUND;
        const updated = applyRoundStart(player);
        return {
          ...updated,
          pendingRound: createPendingRound(nextRound, { salary }),
        };
      }),
    []
  );

  const openRoundStartSummary = useCallback((updatedPlayers) => {
    setRoundStartSummary(
      updatedPlayers.map((player) =>
        buildBalanceChangeSummary(
          player,
          player.roundStartEvents ?? buildRoundOneStartEvents()
        )
      )
    );
    setIsRoundStartOpen(true);
  }, []);

  const dismissRoundStart = useCallback(() => {
    setIsRoundStartOpen(false);
    setRoundStartSummary([]);
    setPlayers((current) =>
      current.map(({ roundStartEvents: _, ...player }) => player)
    );
  }, []);

  const completeHousingSetup = useCallback(() => {
    setGameStage(GAME_STAGES.PLAYING);
    setPhase(PHASES.SURVIVAL);
    setTurnIndex(0);
    setLastEventMessage(null);

    setPlayers((current) => {
      const updated = initRoundOne(current).map((player) => ({
        ...player,
        roundStartEvents: buildRoundOneStartEvents(),
      }));
      openRoundStartSummary(updated);
      return updated;
    });
  }, [initRoundOne, openRoundStartSummary]);

  const finishSimultaneousPhase = useCallback(() => {
    setIsResolvingSimultaneous(false);
    setSimultaneousUpdates([]);
    setLastEventMessage(null);

    const currentRound = roundRef.current;

    if (currentRound < TOTAL_ROUNDS) {
      const nextRound = currentRound + 1;
      const updated = applyRoundStartToAll(playersRef.current, nextRound);

      setRound(nextRound);
      setPlayers(updated);
      openRoundStartSummary(updated);
      setPhase(PHASES.SURVIVAL);
      setTurnIndex(0);
      return;
    }

    setGameStage(GAME_STAGES.COMPLETE);
  }, [applyRoundStartToAll, openRoundStartSummary]);

  const beginSimultaneousPhase = useCallback((nextPhaseValue) => {
    setPhase(nextPhaseValue);
    setTurnIndex(0);
    setIsResolvingSimultaneous(true);

    if (nextPhaseValue === PHASES.NETWORTH) {
      const before = playersRef.current;
      const updated = before.map(applyNetWorthPhase);
      const summaries = updated.map((player, index) => {
        const last = player.roundHistory.at(-1);
        const previousLoan = before[index].loan;
        const events =
          last?.loanInterest > 0
            ? [
                {
                  type: "loss",
                  label: "Loan Interest (+10%)",
                  description: "Applied to remaining loan balance",
                  amount: last.loanInterest,
                },
              ]
            : [
                {
                  type: "neutral",
                  label: "No Loan Interest",
                  description:
                    previousLoan > 0
                      ? "Loan paid off — no balance remaining"
                      : "No outstanding loan",
                  amount: 0,
                },
              ];

        return buildBalanceChangeSummary(player, events);
      });

      setSimultaneousUpdates(summaries);
      setPlayers(updated);
      setLastEventMessage("10% loan interest applied to all remaining loan balances");
      return;
    }

    setLastEventMessage("All players — updating simultaneously…");
  }, []);

  useEffect(() => {
    if (!isResolvingSimultaneous) return;
    const timer = setTimeout(finishSimultaneousPhase, NET_WORTH_PHASE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [isResolvingSimultaneous, finishSimultaneousPhase]);

  useEffect(() => {
    if (!isRoundStartOpen) return;
    const timer = setTimeout(dismissRoundStart, ROUND_START_DURATION_MS);
    return () => clearTimeout(timer);
  }, [isRoundStartOpen, round, dismissRoundStart]);

  const nextPhase = useCallback(() => {
    if (isResolvingSimultaneousRef.current || gameStageRef.current !== GAME_STAGES.PLAYING) {
      return;
    }

    const currentPhase = phaseRef.current;
    if (currentPhase >= PHASES.NETWORTH) return;

    const upcoming = currentPhase + 1;
    if (isSimultaneousPhase(upcoming)) {
      beginSimultaneousPhase(upcoming);
      return;
    }
    setPhase(upcoming);
  }, [beginSimultaneousPhase]);

  const onTurnCycleComplete = useCallback(() => {
    const stage = gameStageRef.current;

    if (stage === GAME_STAGES.HOUSING) {
      // Defer until the last housing choice is committed (avoids stale playersRef)
      setTimeout(completeHousingSetup, 0);
      return;
    }

    if (
      stage === GAME_STAGES.PLAYING &&
      !isResolvingSimultaneousRef.current &&
      !isRoundStartOpenRef.current &&
      !isSimultaneousPhase(phaseRef.current)
    ) {
      nextPhase();
    }
  }, [completeHousingSetup, nextPhase]);

  const nextTurn = useCallback(() => {
    if (isResolvingSimultaneousRef.current || isSimultaneousPhase(phaseRef.current)) {
      return;
    }

    const stage = gameStageRef.current;
    if (stage !== GAME_STAGES.PLAYING && stage !== GAME_STAGES.HOUSING) {
      return;
    }

    setTurnIndex((current) => {
      const next = current < PLAYER_COUNT - 1 ? current + 1 : 0;
      if (current === PLAYER_COUNT - 1 && next === 0) {
        queueMicrotask(onTurnCycleComplete);
      }
      return next;
    });
  }, [onTurnCycleComplete]);

  const clearDiceAdvanceTimer = useCallback(() => {
    if (diceAdvanceTimerRef.current) {
      clearTimeout(diceAdvanceTimerRef.current);
      diceAdvanceTimerRef.current = null;
    }
    isDiceSettlingRef.current = false;
    setIsDiceSettling(false);
  }, []);

  const scheduleDiceAdvance = useCallback(() => {
    clearDiceAdvanceTimer();
    isDiceSettlingRef.current = true;
    setIsDiceSettling(true);
    diceAdvanceTimerRef.current = setTimeout(() => {
      diceAdvanceTimerRef.current = null;
      isDiceSettlingRef.current = false;
      setIsDiceSettling(false);
      nextTurn();
    }, DICE_RESULT_DELAY_MS);
  }, [clearDiceAdvanceTimer, nextTurn]);

  useEffect(() => () => clearDiceAdvanceTimer(), [clearDiceAdvanceTimer]);

  useEffect(() => {
    if (phase !== PHASES.DICE) {
      clearDiceAdvanceTimer();
    }
  }, [phase, clearDiceAdvanceTimer]);

  const updatePlayer = useCallback((index, updates) => {
    setPlayers((current) => {
      const updated = [...current];
      updated[index] = { ...updated[index], ...updates };
      return updated;
    });
  }, []);

  const executeAutoPlayTurn = useCallback(() => {
    if (
      isResolvingSimultaneousRef.current ||
      isSimultaneousPhase(phaseRef.current) ||
      isRoundStartOpenRef.current ||
      isDiceSettlingRef.current
    ) {
      return { applied: false };
    }

    const idx = turnIndexRef.current;
    const player = playersRef.current[idx];
    const currentPhase = phaseRef.current;
    const currentRound = roundRef.current;
    const stage = gameStageRef.current;

    if (!player) return { applied: false };

    if (stage === GAME_STAGES.HOUSING) {
      if (player.rentType) {
        nextTurn();
        return { applied: true, isHousingSetup: true };
      }
      const choice = getRandomHousingChoice();
      setPlayers((current) => {
        const next = [...current];
        next[idx] = { ...next[idx], rentType: choice.id.toUpperCase() };
        return next;
      });
      setLastEventMessage(`${player.name} selected ${choice.name}`);
      nextTurn();
      return { applied: true, isHousingSetup: true };
    }

    if (stage !== GAME_STAGES.PLAYING) {
      return { applied: false };
    }

    switch (currentPhase) {
      case PHASES.SURVIVAL: {
        setPlayers((current) => {
          const activeIdx = turnIndexRef.current;
          const activePlayer = current[activeIdx];
          if (!activePlayer) return current;

          const rentRoll = playerRequiresRentDice(activePlayer)
            ? getRandomDiceRoll()
            : null;
          const { player: updated, totalCost, rent } = applySurvivalTurn(
            activePlayer,
            roundRef.current,
            rentRoll
          );
          setLastEventMessage(
            rentRoll != null
              ? `${activePlayer.name} rolled ${rentRoll} for rent — ₦${rent.toLocaleString()} + survival (₦${totalCost.toLocaleString()} total)`
              : `${activePlayer.name} paid survival + rent (₦${totalCost.toLocaleString()}, rent ₦${rent.toLocaleString()})`
          );
          const next = [...current];
          next[activeIdx] = updated;
          return next;
        });
        nextTurn();
        return { applied: true };
      }
      case PHASES.LOAN: {
        setPlayers((current) => {
          const activeIdx = turnIndexRef.current;
          const activePlayer = current[activeIdx];
          if (!activePlayer) return current;

          const amount = getRandomLoanPayment(activePlayer, roundRef.current);
          const { player: updated } = applyLoanTurn(
            activePlayer,
            amount,
            roundRef.current
          );
          setLastEventMessage(
            `${activePlayer.name} auto-paid minimum ₦${amount.toLocaleString()} on loan`
          );
          const next = [...current];
          next[activeIdx] = updated;
          return next;
        });
        nextTurn();
        return { applied: true };
      }
      case PHASES.DICE: {
        const roll = getRandomDiceRoll();
        setPlayers((current) => {
          const { player: updated, message } = applyDiceEvent(
            current[idx],
            roll,
            currentRound
          );
          setLastEventMessage(`${player.name} auto-rolled ${roll} — ${message}`);
          const next = [...current];
          next[idx] = updated;
          return next;
        });
        scheduleDiceAdvance();
        return { applied: true };
      }
      default:
        return { applied: false };
    }
  }, [nextTurn, scheduleDiceAdvance]);

  const handleSurvivalPayment = useCallback(
    (playerIndex, rentDiceRoll = null) => {
      setPlayers((current) => {
        const player = current[playerIndex];
        if (!player) return current;

        const { player: updated, totalCost, rent, rentDiceRoll: roll } =
          applySurvivalTurn(player, roundRef.current, rentDiceRoll);
        setLastEventMessage(
          roll != null
            ? `Rolled ${roll} for rent — ₦${rent.toLocaleString()} + survival ₦${SURVIVAL_COST.toLocaleString()} (total ₦${totalCost.toLocaleString()})`
            : `Survival + rent paid — ₦${totalCost.toLocaleString()} (rent ₦${rent.toLocaleString()})`
        );
        const next = [...current];
        next[playerIndex] = updated;
        return next;
      });
    },
    []
  );

  const handleLoanPayment = useCallback(
    (playerIndex, amount) => {
      const player = playersRef.current[playerIndex];
      const currentRound = roundRef.current;
      const { player: updated } = applyLoanTurn(player, amount, currentRound);
      updatePlayer(playerIndex, updated);
    },
    [updatePlayer]
  );

  const handleDiceRoll = useCallback(
    (playerIndex, roll) => {
      setPlayers((current) => {
        const { player: updated, message } = applyDiceEvent(
          current[playerIndex],
          roll,
          roundRef.current
        );
        setLastEventMessage(message);
        const next = [...current];
        next[playerIndex] = updated;
        return next;
      });
      scheduleDiceAdvance();
    },
    [scheduleDiceAdvance]
  );

  return {
    gameStage,
    round,
    phase,
    turnIndex,
    players,
    nextTurn,
    nextPhase,
    updatePlayer,
    handleSurvivalPayment,
    handleLoanPayment,
    handleDiceRoll,
    isGameComplete: gameStage === GAME_STAGES.COMPLETE,
    lastEventMessage,
    isResolvingSimultaneous,
    isRoundStartOpen,
    roundStartSummary,
    simultaneousUpdates,
    dismissRoundStart,
    executeAutoPlayTurn,
    isDiceSettling,
    totalRounds: TOTAL_ROUNDS,
  };
};
