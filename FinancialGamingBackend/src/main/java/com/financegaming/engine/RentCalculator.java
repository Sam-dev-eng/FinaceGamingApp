package com.financegaming.engine;

import com.financegaming.domain.HousingType;
import com.financegaming.domain.PlayerState;

public final class RentCalculator {

    private RentCalculator() {
    }

    public static long calculateParentsRent(int diceRoll) {
        var housing = GameConstants.housingOption(HousingType.PARENTS);
        int roll = Math.min(6, Math.max(1, diceRoll));
        return Math.round(housing.baseCost() * (1 + housing.inflationOnDice() * roll));
    }

    public static long calculateRoundRent(PlayerState player, Integer rentDiceRoll) {
        if (player.rentType() == null) {
            return 0;
        }
        var housing = GameConstants.housingOption(player.rentType());
        if (player.rentType() == HousingType.PARENTS) {
            if (rentDiceRoll != null) {
                return calculateParentsRent(rentDiceRoll);
            }
            return housing.baseCost();
        }
        return Math.round(housing.baseCost() * (1 + housing.fixedRate()));
    }
}
