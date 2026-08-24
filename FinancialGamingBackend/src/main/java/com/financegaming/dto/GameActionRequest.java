package com.financegaming.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record GameActionRequest(
        @NotBlank String gameId,
        @NotBlank String playerId,
        @NotBlank String action,
        String sessionToken,
        String rentType,
        Integer rentDiceRoll,
        Long loanAmount,
        Integer diceRoll
) {
}
