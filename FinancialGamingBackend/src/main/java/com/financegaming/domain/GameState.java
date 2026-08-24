package com.financegaming.domain;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record GameState(
        String gameId,
        String roomCode,
        GameStage gameStage,
        int round,
        Phase phase,
        int turnIndex,
        List<PlayerState> players,
        List<SpectatorState> spectators,
        String lastEventMessage,
        boolean roundStartOpen,
        List<BalanceChangeSummary> roundStartSummary,
        boolean resolvingSimultaneous,
        List<BalanceChangeSummary> simultaneousUpdates,
        int totalRounds,
        boolean diceSettling,
        String currentPlayerId,
        int turnTimeoutSeconds,
        long roundStartDurationMs,
        long diceResultDelayMs,
        Long turnDeadlineEpochMs,
        Long phaseDeadlineEpochMs
) {
}
