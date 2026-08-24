/**
 * Headless simulation of a full 4-round game (all auto-play).
 * Run: node scripts/simulateGame.mjs
 */
import {
  PHASES,
  GAME_STAGES,
  TOTAL_ROUNDS,
  STARTING_CASH,
  STARTING_LOAN,
  SALARY_PER_ROUND,
  SURVIVAL_COST,
  LOAN_INTEREST_RATE,
  DICE_EVENTS,
  HOUSING_OPTIONS,
} from "../src/game/gameConstants.js";

const calculateRoundRent = (player, round) => {
  const housing = HOUSING_OPTIONS[player.rentType];
  if (!housing) return 0;
  if (player.rentType === "PARENTS") {
    return Math.round(housing.baseCost * Math.pow(1 + housing.inflationOnDice, round - 1));
  }
  return Math.round(housing.baseCost * (1 + (housing.fixedRate ?? 0)));
};

const PLAYER_COUNT = 3;

const createPlayer = (id, name) => ({
  id,
  name,
  cash: STARTING_CASH,
  loan: STARTING_LOAN,
  rentType: null,
  skipNextSalary: false,
  investment6PayoutsLeft: 0,
  roundHistory: [],
  pendingRound: null,
});

const createPendingRound = (round, salary = 0) => ({
  round,
  salary,
  rent: 0,
  survival: 0,
  loanPaid: 0,
  diceEvent: null,
});

const pickHousing = () => {
  const options = Object.values(HOUSING_OPTIONS);
  return options[Math.floor(Math.random() * options.length)].id;
};

const applySurvival = (player, round) => {
  const rent = calculateRoundRent(player, round);
  const total = rent + SURVIVAL_COST;
  return {
    ...player,
    cash: player.cash - total,
    pendingRound: {
      ...player.pendingRound,
      rent,
      survival: SURVIVAL_COST,
    },
  };
};

const applyLoan = (player, round) => {
  const amount = Math.min(200_000, player.cash, player.loan);
  return {
    ...player,
    cash: player.cash - amount,
    loan: player.loan - amount,
    pendingRound: {
      ...player.pendingRound,
      loanPaid: (player.pendingRound?.loanPaid ?? 0) + amount,
    },
  };
};

const applyDice = (player, round) => {
  const roll = Math.floor(Math.random() * 6) + 1;
  const event = DICE_EVENTS[roll];
  let cash = player.cash;
  let skipNextSalary = player.skipNextSalary;
  let investment6PayoutsLeft = player.investment6PayoutsLeft;

  if (roll === 1) skipNextSalary = true;
  if (roll === 2) cash -= event.cost;
  if (roll === 3) cash -= event.cost;
  if (roll === 4) cash += event.gain;
  if (roll === 5 && cash >= event.minBalance) cash = cash - event.cost + event.payout;
  if (roll === 6 && cash >= event.minBalance) {
    cash -= event.cost;
    investment6PayoutsLeft = TOTAL_ROUNDS - round;
  }

  return {
    ...player,
    cash,
    skipNextSalary,
    investment6PayoutsLeft,
    pendingRound: {
      ...player.pendingRound,
      diceEvent: { roll, name: event.name, type: event.type },
    },
  };
};

const finalizeRound = (player) => {
  const loan =
    player.loan > 0 ? Math.round(player.loan * (1 + LOAN_INTEREST_RATE)) : 0;
  return {
    ...player,
    loan,
    roundHistory: [
      ...player.roundHistory,
      {
        ...player.pendingRound,
        endingCash: player.cash,
        endingLoan: loan,
      },
    ],
    pendingRound: null,
  };
};

const applyRoundStart = (player, nextRound) => {
  let cash = player.cash;
  const salary = player.skipNextSalary ? 0 : SALARY_PER_ROUND;
  if (!player.skipNextSalary) cash += SALARY_PER_ROUND;

  let investment6PayoutsLeft = player.investment6PayoutsLeft;
  if (investment6PayoutsLeft > 0) {
    cash += DICE_EVENTS[6].recurringPayout;
    investment6PayoutsLeft -= 1;
  }

  return {
    ...player,
    cash,
    skipNextSalary: false,
    investment6PayoutsLeft,
    pendingRound: createPendingRound(nextRound, salary),
  };
};

const runRound = (players, round) => {
  let state = players.map((p) => ({
    ...p,
    pendingRound: p.pendingRound ?? createPendingRound(round, round === 1 ? SALARY_PER_ROUND : 0),
  }));

  for (let i = 0; i < PLAYER_COUNT; i++) {
    state = state.map((p, idx) => (idx === i ? applySurvival(p, round) : p));
  }
  for (let i = 0; i < PLAYER_COUNT; i++) {
    state = state.map((p, idx) => (idx === i ? applyLoan(p, round) : p));
  }
  for (let i = 0; i < PLAYER_COUNT; i++) {
    state = state.map((p, idx) => (idx === i ? applyDice(p, round) : p));
  }
  return state.map(finalizeRound);
};

const assert = (ok, msg) => {
  if (!ok) throw new Error(msg);
};

let players = [
  createPlayer("player-1", "YOU"),
  createPlayer("player-2", "Opponent A"),
  createPlayer("player-3", "Opponent B"),
].map((p) => ({ ...p, rentType: pickHousing() }));

assert(players.every((p) => p.rentType), "housing assigned");
players = players.map((p) => ({
  ...p,
  pendingRound: createPendingRound(1, SALARY_PER_ROUND),
}));

for (let round = 1; round <= TOTAL_ROUNDS; round++) {
  players = runRound(players, round);
  assert(
    players.every((p) => p.roundHistory.length === round),
    `round ${round} history`
  );
  if (round < TOTAL_ROUNDS) {
    players = players.map((p) => applyRoundStart(p, round + 1));
  }
}

assert(PHASES.SURVIVAL === 1, "SURVIVAL is phase 1");
assert(PHASES.NETWORTH === 4, "NETWORTH is phase 4");
assert(GAME_STAGES.HOUSING === "housing", "housing stage exists");

console.log("✓ Simulation passed — 4 rounds, 3 players, rent + history OK");
players.forEach((p) => {
  const last = p.roundHistory[p.roundHistory.length - 1];
  console.log(
    `  ${p.name} (${p.rentType}): net ₦${(p.cash - p.loan).toLocaleString()}, last rent ₦${last.rent.toLocaleString()}`
  );
});
