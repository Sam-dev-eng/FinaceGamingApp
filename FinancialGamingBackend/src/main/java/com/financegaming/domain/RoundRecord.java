package com.financegaming.domain;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record RoundRecord(
        int round,
        long salary,
        long rent,
        long survival,
        long loanPaid,
        long loanInterest,
        Integer rentDiceRoll,
        DiceEventRecord diceEvent,
        long endingCash,
        long endingLoan
) {
}
