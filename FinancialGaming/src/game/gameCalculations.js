import { HOUSING_OPTIONS, LOAN_INTEREST_RATE } from "./gameConstants";

export const normalizeRentType = (rentType) =>
  typeof rentType === "string" ? rentType.toUpperCase() : null;

/** Rent for Stay with Parent/Guardian — 2% inflation per dice pip rolled */
export const calculateParentsRent = (diceRoll) => {
  const housing = HOUSING_OPTIONS.PARENTS;
  const roll = Math.min(6, Math.max(1, diceRoll ?? 1));
  return Math.round(housing.baseCost * (1 + housing.inflationOnDice * roll));
};

/** Rent due for the given round based on housing choice locked at game start */
export const calculateRoundRent = (player, round, rentDiceRoll = null) => {
  const rentType = normalizeRentType(player.rentType);
  const housing = HOUSING_OPTIONS[rentType];
  if (!housing) return 0;

  if (rentType === "PARENTS") {
    if (rentDiceRoll != null) {
      return calculateParentsRent(rentDiceRoll);
    }
    return housing.baseCost;
  }

  const rate = housing.fixedRate ?? 0;
  return Math.round(housing.baseCost * (1 + rate));
};

export const playerRequiresRentDice = (player) =>
  normalizeRentType(player?.rentType) === "PARENTS";

export const calculateNetWorth = (cash, loan) => cash - loan;

export const formatNaira = (amount) =>
  `₦${Number(amount).toLocaleString("en-NG")}`;

export const rankPlayersByNetWorth = (players) =>
  [...players]
    .map((player) => ({
      ...player,
      netWorth: calculateNetWorth(player.cash, player.loan),
    }))
    .sort((a, b) => b.netWorth - a.netWorth)
    .map((player, index) => ({
      ...player,
      rank: index + 1,
    }));

export const buildNetWorthBreakdown = (player) => {
  const netWorth = calculateNetWorth(player.cash, player.loan);

  return {
    playerId: player.id,
    name: player.name,
    cash: player.cash,
    loan: player.loan,
    netWorth,
    formula: `${formatNaira(player.cash)} − ${formatNaira(player.loan)} = ${formatNaira(netWorth)}`,
    steps: [
      { label: "Available Cash", value: player.cash, type: "cash" },
      { label: "Loan Balance", value: player.loan, type: "loan" },
      { label: "Net Worth", value: netWorth, type: "net" },
    ],
  };
};

export const applyLoanInterest = (loan) =>
  loan > 0 ? Math.round(loan * (1 + LOAN_INTEREST_RATE)) : 0;

/** Apply 10% interest to remaining loan; returns amounts for UI/history */
export const applyLoanInterestToPlayer = (player) => {
  const previousLoan = player.loan;
  const loan = applyLoanInterest(previousLoan);
  const loanInterest = loan - previousLoan;

  return {
    player: { ...player, loan },
    previousLoan,
    loan,
    loanInterest,
  };
};

export const getWinner = (players) => rankPlayersByNetWorth(players)[0] ?? null;
