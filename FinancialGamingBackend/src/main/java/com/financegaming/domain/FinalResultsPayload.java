package com.financegaming.domain;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record FinalResultsPayload(
        String gameId,
        int totalRounds,
        String currentPlayerId,
        List<PlayerState> players
) {
}
