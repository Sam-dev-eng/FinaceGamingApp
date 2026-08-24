import {
  DICE_EVENTS,
  SALARY_PER_ROUND,
  TOTAL_ROUNDS,
  SURVIVAL_COST,
} from "./gameConstants";
import {
  calculateRoundRent,
  applyLoanInterestToPlayer,
  playerRequiresRentDice,
} from "./gameCalculations";

export const createPlayerState = (overrides = {}) => ({
  skipNextSalary: false,
  investment6PayoutsLeft: 0,
  lastDiceEvent: null,
  roundHistory: [],
  pendingRound: null,
  ...overrides,
});

const withPendingRoundUpdate = (player, round, updates) => ({
  ...player,
  pendingRound: {
    round,
    salary: 0,
    rent: 0,
    survival: 0,
    loanPaid: 0,
    loanInterest: 0,
    diceEvent: null,
    ...player.pendingRound,
    ...updates,
  },
});

export const createPendingRound = (round, { salary = 0 } = {}) => ({
  round,
  salary,
  rent: 0,
  survival: 0,
  loanPaid: 0,
  loanInterest: 0,
  diceEvent: null,
});

/** Survival turn: pay rent + survival costs for the current round */
export const applySurvivalTurn = (player, round, rentDiceRoll = null) => {
  if (playerRequiresRentDice(player) && rentDiceRoll == null) {
    throw new Error("Parents housing requires a dice roll to calculate rent");
  }

  const rent = calculateRoundRent(player, round, rentDiceRoll);
  const totalCost = rent + SURVIVAL_COST;

  return {
    player: {
      ...withPendingRoundUpdate(player, round, {
        rent,
        survival: SURVIVAL_COST,
        rentDiceRoll: playerRequiresRentDice(player) ? rentDiceRoll : undefined,
      }),
      cash: player.cash - totalCost,
    },
    rent,
    survival: SURVIVAL_COST,
    totalCost,
    rentDiceRoll,
  };
};

export const applyLoanTurn = (player, amount, round) => ({
  player: {
    ...withPendingRoundUpdate(player, round, {
      loanPaid: (player.pendingRound?.loanPaid ?? 0) + amount,
    }),
    cash: player.cash - amount,
    loan: player.loan - amount,
  },
});

export const finalizePlayerRound = (player) => {
  if (!player.pendingRound) return player;

  return {
    ...player,
    roundHistory: [...player.roundHistory, {
      ...player.pendingRound,
      endingCash: player.cash,
      endingLoan: player.loan,
    }],
    pendingRound: null,
  };
};

/**
 * Apply a dice roll result to a player.
 * Returns { player, message, applied }.
 */
export const applyDiceEvent = (player, roll, currentRound) => {
  const event = DICE_EVENTS[roll];
  if (!event) {
    return { player, message: "Unknown event", applied: false };
  }

  let cash = player.cash;
  let skipNextSalary = player.skipNextSalary;
  let investment6PayoutsLeft = player.investment6PayoutsLeft;
  let message = event.description ?? event.name;

  switch (roll) {
    case 1:
      skipNextSalary = true;
      message = "Job Loss! You will miss your next round's salary.";
      break;

    case 2:
      cash -= event.cost;
      message = `Medical Emergency — ₦${event.cost.toLocaleString()} deducted.`;
      break;

    case 3:
      cash -= event.cost;
      message = `Family Emergency — ₦${event.cost.toLocaleString()} deducted.`;
      break;

    case 4:
      cash += event.gain;
      message = `Family Support — ₦${event.gain.toLocaleString()} added.`;
      break;

    case 5:
      if (cash >= event.minBalance) {
        cash = cash - event.cost + event.payout;
        message = `Investment paid ₦${event.cost.toLocaleString()}, received ₦${event.payout.toLocaleString()}!`;
      } else {
        message = `Investment requires at least ₦${event.minBalance.toLocaleString()} — insufficient balance.`;
        return {
          player: { ...player, lastDiceEvent: { roll, ...event, applied: false } },
          message,
          applied: false,
        };
      }
      break;

    case 6:
      if (cash >= event.minBalance) {
        cash -= event.cost;
        investment6PayoutsLeft = TOTAL_ROUNDS - currentRound;
        message = `Investment paid ₦${event.cost.toLocaleString()}. You will receive ₦${event.recurringPayout.toLocaleString()} at the start of each remaining round.`;
      } else {
        message = `Investment requires at least ₦${event.minBalance.toLocaleString()} — insufficient balance.`;
        return {
          player: { ...player, lastDiceEvent: { roll, ...event, applied: false } },
          message,
          applied: false,
        };
      }
      break;

    default:
      break;
  }

  const diceEvent = { roll, name: event.name, type: event.type, applied: true };
  if (roll === 2 || roll === 3) diceEvent.amount = event.cost;
  if (roll === 4) diceEvent.amount = event.gain;
  if (roll === 5 || roll === 6) diceEvent.amount = event.cost;

  return {
    player: {
      ...withPendingRoundUpdate(player, currentRound, { diceEvent }),
      cash,
      skipNextSalary,
      investment6PayoutsLeft,
      lastDiceEvent: { roll, ...event, applied: true },
    },
    message,
    applied: true,
  };
};

/**
 * Called at the start of rounds 2–4.
 * Round 1 starting cash already includes the first salary.
 */
export const applyRoundStart = (player) => {
  let cash = player.cash;
  const roundStartEvents = [];

  if (player.skipNextSalary) {
    roundStartEvents.push({
      type: "skip",
      label: "Job Loss",
      description: "Salary skipped this round",
      amount: 0,
    });
  } else {
    cash += SALARY_PER_ROUND;
    roundStartEvents.push({
      type: "gain",
      label: "Salary",
      description: "6-month salary deposited",
      amount: SALARY_PER_ROUND,
    });
  }

  let investment6PayoutsLeft = player.investment6PayoutsLeft;

  if (investment6PayoutsLeft > 0) {
    const payout = DICE_EVENTS[6].recurringPayout;
    cash += payout;
    investment6PayoutsLeft -= 1;
    roundStartEvents.push({
      type: "gain",
      label: "Investment Payout",
      description: "Recurring investment (dice 6)",
      amount: payout,
    });
  }

  return {
    ...player,
    cash,
    skipNextSalary: false,
    investment6PayoutsLeft,
    roundStartEvents,
  };
};

export const buildRoundOneStartEvents = () => [
  {
    type: "gain",
    label: "Salary",
    description: "Already included in your starting cash",
    amount: SALARY_PER_ROUND,
  },
];

export const buildBalanceChangeSummary = (player, events) => ({
  id: player.id,
  name: player.name,
  cash: player.cash,
  loan: player.loan,
  netWorth: player.cash - player.loan,
  events,
});

/** End-of-round: apply 10% loan interest and archive round history */
export const applyNetWorthPhase = (player) => {
  const { player: withInterest, loanInterest } = applyLoanInterestToPlayer(player);

  const withHistory = withInterest.pendingRound
    ? {
        ...withInterest,
        pendingRound: { ...withInterest.pendingRound, loanInterest },
      }
    : withInterest;

  return finalizePlayerRound(withHistory);
};
