package com.financegaming.engine;

public final class GameConstants {

    private GameConstants() {
    }

    public static final int TOTAL_ROUNDS = 4;
    public static final long STARTING_CASH = 2_400_000L;
    public static final long STARTING_LOAN = 1_500_000L;
    public static final int STARTING_CREDIT_SCORE = 500;
    public static final int MIN_CREDIT_SCORE_TO_BORROW = 200;
    public static final int MIN_CREDIT_SCORE = 300;
    public static final int MAX_CREDIT_SCORE = 850;
    public static final long SALARY_PER_ROUND = 2_400_000L;
    public static final long SURVIVAL_COST = 700_000L;
    public static final double LOAN_INTEREST_RATE = 0.1;
    public static final long BASE_MIN_LOAN_PAYMENT = 150_000L;
    public static final int PLAYER_COUNT = 3;

    public static long getMinimumLoanPayment(int round) {
        return Math.round(BASE_MIN_LOAN_PAYMENT * Math.pow(1 + LOAN_INTEREST_RATE, round - 1));
    }

    public record HousingOption(long baseCost, double fixedRate, double inflationOnDice) {
    }

    public static HousingOption housingOption(com.financegaming.domain.HousingType type) {
        return switch (type) {
            case PARENTS -> new HousingOption(150_000L, 0, 0.02);
            case SHARED -> new HousingOption(300_000L, 0.2, 0);
            case SINGLE -> new HousingOption(900_000L, 0.15, 0);
            case LUXURY -> new HousingOption(1_500_000L, 0.05, 0);
        };
    }

    public record DiceEventDef(
            String name,
            String description,
            String type,
            Long cost,
            Long gain,
            Long minBalance,
            Long payout,
            Long recurringPayout
    ) {
    }

    public static DiceEventDef diceEvent(int roll) {
        return switch (roll) {
            case 1 -> new DiceEventDef("Job Loss", "Miss next round's salary", "PENALTY", null, null, null, null, null);
            case 2 -> new DiceEventDef("Medical Emergency", null, "PENALTY", 400_000L, null, null, null, null);
            case 3 -> new DiceEventDef("Family Emergency", null, "PENALTY", 300_000L, null, null, null, null);
            case 4 -> new DiceEventDef("Family Support", null, "GAIN", null, 200_000L, null, null, null);
            case 5 -> new DiceEventDef("Investment Opportunity", null, "INVESTMENT", 500_000L, null, 500_000L, 900_000L, null);
            case 6 -> new DiceEventDef("Investment Opportunity", null, "INVESTMENT", 600_000L, null, 600_000L, null, 340_000L);
            default -> null;
        };
    }
}
