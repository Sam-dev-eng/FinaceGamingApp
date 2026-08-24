export const TOTAL_ROUNDS = 4;

export const STARTING_CASH = 2_400_000;
export const STARTING_LOAN = 1_500_000;
export const STARTING_CREDIT_SCORE = 500;
export const MIN_CREDIT_SCORE_TO_BORROW = 200;

export const SALARY_PER_ROUND = 2_400_000;
export const SURVIVAL_COST = 700_000;
export const LOAN_INTEREST_RATE = 0.1;

/** Minimum loan payment — increases 10% each round (round 1 base) */
export const BASE_MIN_LOAN_PAYMENT = 150_000;

export const getMinimumLoanPayment = (round) =>
  Math.round(BASE_MIN_LOAN_PAYMENT * Math.pow(1 + LOAN_INTEREST_RATE, round - 1));

export const HOUSING_OPTIONS = {
  PARENTS: {
    id: "PARENTS",
    name: "Stay with Parent/Guardian",
    baseCost: 150_000,
    rule: "Inflation @2% on dice",
    inflationOnDice: 0.02,
  },
  SHARED: {
    id: "SHARED",
    name: "Shared Apartment",
    baseCost: 300_000,
    rule: "20% Fixed",
    fixedRate: 0.2,
  },
  SINGLE: {
    id: "SINGLE",
    name: "Single Apartment",
    baseCost: 900_000,
    rule: "15% Fixed",
    fixedRate: 0.15,
  },
  LUXURY: {
    id: "LUXURY",
    name: "Luxury Apartment",
    baseCost: 1_500_000,
    rule: "5% Fixed",
    fixedRate: 0.05,
  },
};

export const DICE_EVENTS = {
  1: {
    name: "Job Loss",
    description: "Miss next round's salary",
    type: "PENALTY",
  },
  2: {
    name: "Medical Emergency",
    cost: 400_000,
    type: "PENALTY",
  },
  3: {
    name: "Family Emergency",
    cost: 300_000,
    type: "PENALTY",
  },
  4: {
    name: "Family Support",
    gain: 200_000,
    type: "GAIN",
  },
  5: {
    name: "Investment Opportunity",
    minBalance: 500_000,
    cost: 500_000,
    payout: 900_000,
    type: "INVESTMENT",
    description: "Pay ₦500k if balance ≥ ₦500k — receive ₦900k once",
  },
  6: {
    name: "Investment Opportunity",
    minBalance: 600_000,
    cost: 600_000,
    recurringPayout: 340_000,
    type: "INVESTMENT",
    description: "Pay ₦600k if balance ≥ ₦600k — receive ₦340k at start of each remaining round",
  },
};

/** In-round phases only — housing is pre-game setup, not a round phase */
export const PHASES = {
  SURVIVAL: 1,
  LOAN: 2,
  DICE: 3,
  NETWORTH: 4,
};

export const GAME_STAGES = {
  LOBBY: "lobby",
  HOUSING: "housing",
  PLAYING: "playing",
  COMPLETE: "complete",
};

/** Phases with no player input — all players resolve at the same time */
export const SIMULTANEOUS_PHASES = [PHASES.NETWORTH];

/** Pause after an emergency dice roll before advancing to the next player */
export const DICE_RESULT_DELAY_MS = 4000;

export const NET_WORTH_PHASE_DURATION_MS = 5000;

/** How long round-start payouts (salary, etc.) are shown to all players */
export const ROUND_START_DURATION_MS = 60_000;

export const isSimultaneousPhase = (phase) => SIMULTANEOUS_PHASES.includes(phase);
