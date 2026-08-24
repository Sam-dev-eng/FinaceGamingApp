import { HOUSING_OPTIONS, getMinimumLoanPayment } from "./gameConstants";

export const getRandomHousingChoice = () => {
  const options = Object.values(HOUSING_OPTIONS);
  const picked = options[Math.floor(Math.random() * options.length)];
  return {
    id: picked.id.toLowerCase(),
    name: picked.name,
  };
};

export const getRandomLoanPayment = (player, round = 1) => {
  const maxPay = Math.min(player.cash, player.loan);
  if (maxPay <= 0) return 0;

  return Math.min(getMinimumLoanPayment(round), maxPay);
};

export const getRandomDiceRoll = () => Math.floor(Math.random() * 6) + 1;
