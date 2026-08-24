package com.financegaming.engine;

import com.financegaming.domain.*;

import java.util.ArrayList;
import java.util.List;

public final class PlayerLogic {

    private PlayerLogic() {
    }

    public record SurvivalResult(PlayerState player, long rent, long totalCost, String message) {
    }

    public record DiceResult(PlayerState player, String message, boolean applied) {
    }

    public static SurvivalResult applySurvival(PlayerState player, int round, Integer rentDiceRoll) {
        if (player.requiresRentDice() && rentDiceRoll == null) {
            throw new IllegalStateException("Parents housing requires a dice roll to calculate rent");
        }

        long rent = RentCalculator.calculateRoundRent(player, rentDiceRoll);
        long totalCost = rent + GameConstants.SURVIVAL_COST;
        if (player.cash() < totalCost) {
            throw new IllegalStateException(
                    "Insufficient cash (₦" + player.cash() + ") — borrow from the bank first. Need ₦" + totalCost);
        }
        PendingRound updatedPending = mergePending(player.pendingRound(), round, pending -> new PendingRound(
                round,
                pending.salary(),
                rent,
                GameConstants.SURVIVAL_COST,
                pending.loanPaid(),
                pending.loanInterest(),
                player.requiresRentDice() ? rentDiceRoll : null,
                pending.diceEvent()
        ));

        PlayerState updated = copyPlayer(player, updatedPending, player.cash() - totalCost, player.loan());
        String message = rentDiceRoll != null
                ? String.format("Rolled %d for rent — ₦%,d + survival (₦%,d total)", rentDiceRoll, rent, totalCost)
                : String.format("Survival + rent paid — ₦%,d (rent ₦%,d)", totalCost, rent);

        return new SurvivalResult(updated, rent, totalCost, message);
    }

    public static PlayerState applyLoan(PlayerState player, long amount, int round) {
        PendingRound pending = mergePending(player.pendingRound(), round, p -> new PendingRound(
                round,
                p.salary(),
                p.rent(),
                p.survival(),
                p.loanPaid() + amount,
                p.loanInterest(),
                p.rentDiceRoll(),
                p.diceEvent()
        ));
        return copyPlayer(player, pending, player.cash() - amount, player.loan() - amount);
    }

    public static PlayerState applySkipLoan(PlayerState player, int round, int newCreditScore) {
        PendingRound pending = mergePending(player.pendingRound(), round, p -> new PendingRound(
                round,
                p.salary(),
                p.rent(),
                p.survival(),
                p.loanPaid(),
                p.loanInterest(),
                p.rentDiceRoll(),
                p.diceEvent()
        ));
        return copyPlayer(player, pending, player.cash(), player.loan(), newCreditScore);
    }

    public static PlayerState applyBankBorrow(PlayerState player, long amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Borrow amount must be positive");
        }
        if (!CreditScoreLogic.canBorrow(player.creditScore())) {
            throw new IllegalStateException(
                    "Credit score must be above " + GameConstants.MIN_CREDIT_SCORE_TO_BORROW + " to borrow");
        }
        int newCredit = CreditScoreLogic.afterBorrow(player.creditScore());
        return copyPlayer(
                player,
                player.pendingRound(),
                player.cash() + amount,
                player.loan() + amount,
                newCredit
        );
    }

    public static PlayerState withCreditScore(PlayerState player, int creditScore) {
        return copyPlayer(player, player.pendingRound(), player.cash(), player.loan(), creditScore);
    }

    public static DiceResult applyDice(PlayerState player, int roll, int round) {
        GameConstants.DiceEventDef event = GameConstants.diceEvent(roll);
        if (event == null) {
            return new DiceResult(player, "Unknown event", false);
        }

        long cash = player.cash();
        boolean skipNextSalary = player.skipNextSalary();
        int investment6PayoutsLeft = player.investment6PayoutsLeft();
        String message = event.description() != null ? event.description() : event.name();

        switch (roll) {
            case 1 -> {
                skipNextSalary = true;
                message = "Job Loss! You will miss your next round's salary.";
            }
            case 2 -> cash -= event.cost();
            case 3 -> cash -= event.cost();
            case 4 -> cash += event.gain();
            case 5 -> {
                if (cash >= event.minBalance()) {
                    cash = cash - event.cost() + event.payout();
                    message = String.format("Investment paid ₦%,d, received ₦%,d!", event.cost(), event.payout());
                } else {
                    message = String.format("Investment requires at least ₦%,d — insufficient balance.", event.minBalance());
                    DiceEventRecord failed = new DiceEventRecord(roll, event.name(), event.type(), false, event.cost());
                    return new DiceResult(copyDice(player, round, failed, cash, skipNextSalary, investment6PayoutsLeft), message, false);
                }
            }
            case 6 -> {
                if (cash >= event.minBalance()) {
                    cash -= event.cost();
                    investment6PayoutsLeft = GameConstants.TOTAL_ROUNDS - round;
                    message = String.format(
                            "Investment paid ₦%,d. You will receive ₦%,d at the start of each remaining round.",
                            event.cost(),
                            event.recurringPayout()
                    );
                } else {
                    message = String.format("Investment requires at least ₦%,d — insufficient balance.", event.minBalance());
                    DiceEventRecord failed = new DiceEventRecord(roll, event.name(), event.type(), false, event.cost());
                    return new DiceResult(copyDice(player, round, failed, cash, skipNextSalary, investment6PayoutsLeft), message, false);
                }
            }
            default -> {
            }
        }

        Long amount = switch (roll) {
            case 2, 3, 5, 6 -> event.cost();
            case 4 -> event.gain();
            default -> null;
        };
        DiceEventRecord diceEvent = new DiceEventRecord(roll, event.name(), event.type(), true, amount);
        return new DiceResult(copyDice(player, round, diceEvent, cash, skipNextSalary, investment6PayoutsLeft), message, true);
    }

    public static PlayerState applyRoundStart(PlayerState player) {
        long cash = player.cash();
        List<RoundStartEvent> events = new ArrayList<>();

        if (player.skipNextSalary()) {
            events.add(new RoundStartEvent("skip", "Job Loss", "Salary skipped this round", 0));
        } else {
            cash += GameConstants.SALARY_PER_ROUND;
            events.add(new RoundStartEvent("gain", "Salary", "6-month salary deposited", GameConstants.SALARY_PER_ROUND));
        }

        int investment6PayoutsLeft = player.investment6PayoutsLeft();
        if (investment6PayoutsLeft > 0) {
            long payout = GameConstants.diceEvent(6).recurringPayout();
            cash += payout;
            investment6PayoutsLeft -= 1;
            events.add(new RoundStartEvent("gain", "Investment Payout", "Recurring investment (dice 6)", payout));
        }

        return new PlayerState(
                player.id(),
                player.name(),
                cash,
                player.loan(),
                player.creditScore(),
                player.rentType(),
                false,
                investment6PayoutsLeft,
                player.lastDiceEvent(),
                player.roundHistory(),
                player.pendingRound(),
                events,
                player.status(),
                player.host(),
                player.seatIndex(),
                player.bot(),
                player.connected()
        );
    }

    public static PlayerState applyNetWorthPhase(PlayerState player) {
        long previousLoan = player.loan();
        long loan = previousLoan > 0
                ? Math.round(previousLoan * (1 + GameConstants.LOAN_INTEREST_RATE))
                : 0;
        long loanInterest = loan - previousLoan;

        PendingRound pending = player.pendingRound();
        if (pending != null) {
            pending = new PendingRound(
                    pending.round(),
                    pending.salary(),
                    pending.rent(),
                    pending.survival(),
                    pending.loanPaid(),
                    loanInterest,
                    pending.rentDiceRoll(),
                    pending.diceEvent()
            );
        }

        PlayerState withInterest = copyPlayer(player, pending, player.cash(), loan);
        return finalizeRound(withInterest);
    }

    public static PlayerState finalizeRound(PlayerState player) {
        PendingRound pending = player.pendingRound();
        if (pending == null) {
            return player;
        }

        RoundRecord record = new RoundRecord(
                pending.round(),
                pending.salary(),
                pending.rent(),
                pending.survival(),
                pending.loanPaid(),
                pending.loanInterest(),
                pending.rentDiceRoll(),
                pending.diceEvent(),
                player.cash(),
                player.loan()
        );

        List<RoundRecord> history = new ArrayList<>(player.roundHistory());
        history.add(record);

        return new PlayerState(
                player.id(),
                player.name(),
                player.cash(),
                player.loan(),
                player.creditScore(),
                player.rentType(),
                player.skipNextSalary(),
                player.investment6PayoutsLeft(),
                player.lastDiceEvent(),
                history,
                null,
                null,
                player.status(),
                player.host(),
                player.seatIndex(),
                player.bot(),
                player.connected()
        );
    }

    private static PlayerState copyDice(
            PlayerState player,
            int round,
            DiceEventRecord diceEvent,
            long cash,
            boolean skipNextSalary,
            int investment6PayoutsLeft
    ) {
        PendingRound pending = mergePending(player.pendingRound(), round, p -> new PendingRound(
                round,
                p.salary(),
                p.rent(),
                p.survival(),
                p.loanPaid(),
                p.loanInterest(),
                p.rentDiceRoll(),
                diceEvent
        ));

        return new PlayerState(
                player.id(),
                player.name(),
                cash,
                player.loan(),
                player.creditScore(),
                player.rentType(),
                skipNextSalary,
                investment6PayoutsLeft,
                diceEvent,
                player.roundHistory(),
                pending,
                player.roundStartEvents(),
                player.status(),
                player.host(),
                player.seatIndex(),
                player.bot(),
                player.connected()
        );
    }

    private static PlayerState copyPlayer(PlayerState player, PendingRound pending, long cash, long loan) {
        return copyPlayer(player, pending, cash, loan, player.creditScore());
    }

    private static PlayerState copyPlayer(
            PlayerState player,
            PendingRound pending,
            long cash,
            long loan,
            int creditScore
    ) {
        return new PlayerState(
                player.id(),
                player.name(),
                cash,
                loan,
                creditScore,
                player.rentType(),
                player.skipNextSalary(),
                player.investment6PayoutsLeft(),
                player.lastDiceEvent(),
                player.roundHistory(),
                pending,
                player.roundStartEvents(),
                player.status(),
                player.host(),
                player.seatIndex(),
                player.bot(),
                player.connected()
        );
    }

    private interface PendingMerger {
        PendingRound merge(PendingRound current);
    }

    private static PendingRound mergePending(PendingRound existing, int round, PendingMerger merger) {
        PendingRound base = existing != null ? existing : PendingRound.empty(round, 0);
        if (base.round() != round) {
            base = PendingRound.empty(round, 0);
        }
        return merger.merge(base);
    }
}
