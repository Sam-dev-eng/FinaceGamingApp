import { SALARY_PER_ROUND, SURVIVAL_COST, TOTAL_ROUNDS } from "./gameConstants";
import { TURN_TIMEOUT_SECONDS, formatTurnTimeoutLabel } from "../config/env";

export const ROUND_DETAILS = {
  1: {
    title: "Round 1 — First 6 Months",
    subtitle: "Your journey begins",
    highlights: [
      `Receive salary: ₦${SALARY_PER_ROUND.toLocaleString()} (already in starting cash)`,
      `Pay survival costs: ₦${SURVIVAL_COST.toLocaleString()} (transport, food, data)`,
      "Make a student loan payment — minimum increases each round",
      "Roll the dice for an uncertainty event",
      "Net worth update — loan interest applied to all players",
    ],
    tip: "Your housing choice is already locked in — rent applies every round.",
  },
  2: {
    title: "Round 2 — Months 7–12",
    subtitle: "Year one continues",
    highlights: [
      `Salary: ₦${SALARY_PER_ROUND.toLocaleString()} (unless job loss from dice)`,
      `Survival: ₦${SURVIVAL_COST.toLocaleString()} — fixed cost`,
      "Loan payment — 10% interest added after each round",
      "Investment payouts from dice events may arrive this round",
      "Dice event — medical, family, job loss, or investment",
    ],
    tip: "Watch your cash flow — loan interest compounds every round.",
  },
  3: {
    title: "Round 3 — Months 13–18",
    subtitle: "Mid-game pressure",
    highlights: [
      `Salary: ₦${SALARY_PER_ROUND.toLocaleString()} per 6 months`,
      `Survival: ₦${SURVIVAL_COST.toLocaleString()} — non-negotiable`,
      "Student loan minimum payment has increased again",
      "Recurring investment payouts (dice 6) may apply",
      "Net worth rankings start to separate — plan ahead",
    ],
    tip: "Pay down loan early if you can — interest hurts late game.",
  },
  4: {
    title: "Round 4 — Final 6 Months",
    subtitle: "Last chance to win",
    highlights: [
      "Final salary and survival payments",
      "Last dice roll — big swings still possible",
      "Final net worth calculation decides the winner",
      "Winner = highest cash minus remaining loan",
      "Financial freedom awaits the top player",
    ],
    tip: "This is it — every decision counts for the final standings.",
  },
};

export const getRoundDetails = (round) =>
  ROUND_DETAILS[round] ?? {
    title: `Round ${round}`,
    subtitle: `${TOTAL_ROUNDS}-round finance simulation`,
    highlights: ["Play your turn before time runs out"],
    tip: `You have ${formatTurnTimeoutLabel()} per turn.`,
  };

/** Short label + explanation shown under the turn timer each phase. */
export const getTurnPhaseBrief = ({
  phase,
  round,
  isHousingSetup,
  isSimultaneous,
  requiresRentDice,
  minLoanPayment,
  survivalCost = SURVIVAL_COST,
}) => {
  if (isHousingSetup) {
    return {
      title: "Housing setup",
      description:
        "Choose where you will live for all 4 rounds. Rent is charged every round — lower rent frees cash, but some options have variable costs.",
    };
  }

  if (isSimultaneous) {
    return {
      title: "Net worth update",
      description:
        "All players at once: 10% loan interest is applied to every remaining loan balance, then net worth is updated.",
    };
  }

  switch (phase) {
    case 1: // SURVIVAL
      return {
        title: `Round ${round} · Survival + rent`,
        description: requiresRentDice
          ? `Pay compulsory ₦${survivalCost.toLocaleString()} survival (food, transport, data) plus rent. With parent/guardian housing, roll the dice first — rent rises 2% per pip. Borrow from the bank if cash is too low.`
          : `Pay compulsory ₦${survivalCost.toLocaleString()} survival plus your housing rent for this round. These costs are non-negotiable — use the bank panel to borrow if you are short.`,
      };
    case 2: // LOAN
      return {
        title: `Round ${round} · Student loan`,
        description: `Repay your student loan if you want — payment is optional. Recommended minimum this round: ₦${minLoanPayment.toLocaleString()}. Pay any amount, skip for the round, or borrow from the bank. Skipping or underpaying hurts your credit score; 10% interest is added after the round.`,
      };
    case 3: // DICE
      return {
        title: `Round ${round} · Uncertainty event`,
        description:
          "Roll the dice to trigger a random life event — job loss, medical or family emergencies, extra income, or an investment opportunity. Outcomes can help or hurt your finances.",
      };
    case 4: // NETWORTH
      return {
        title: `Round ${round} · Net worth update`,
        description:
          "Loan interest is applied and balances refresh. After Round 4 this phase determines the winner (highest cash minus remaining loan).",
      };
    default:
      return {
        title: `Round ${round}`,
        description: "Complete your turn before the timer runs out.",
      };
  }
};
