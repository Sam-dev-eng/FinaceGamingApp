/**
 * Display-only helpers — server owns all game rules.
 * Do not duplicate survival/loan/dice logic here.
 */
export { rankPlayersByNetWorth, playerRequiresRentDice, calculateParentsRent } from "../../game/gameCalculations";
export { formatNaira } from "./formatNaira";
