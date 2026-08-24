package com.financegaming.domain;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record PendingRound(
        int round,
        long salary,
        long rent,
        long survival,
        long loanPaid,
        long loanInterest,
        Integer rentDiceRoll,
        DiceEventRecord diceEvent
) {
    public static PendingRound empty(int round, long salary) {
        return new PendingRound(round, salary, 0, 0, 0, 0, null, null);
    }
}
