package com.financegaming.domain;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.ArrayList;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record PlayerState(
        String id,
        String name,
        long cash,
        long loan,
        int creditScore,
        HousingType rentType,
        boolean skipNextSalary,
        int investment6PayoutsLeft,
        DiceEventRecord lastDiceEvent,
        List<RoundRecord> roundHistory,
        PendingRound pendingRound,
        List<RoundStartEvent> roundStartEvents,
        PlayerStatus status,
        boolean host,
        int seatIndex,
        boolean bot,
        boolean connected
) {
    public PlayerState {
        if (roundHistory == null) {
            roundHistory = new ArrayList<>();
        }
    }

    public long netWorth() {
        return cash - loan;
    }

    public boolean requiresRentDice() {
        return rentType == HousingType.PARENTS;
    }

    /** @deprecated use {@link #bot()} — kept for clients that relied on name prefix */
    public boolean isBotPlayer() {
        return bot;
    }
}
