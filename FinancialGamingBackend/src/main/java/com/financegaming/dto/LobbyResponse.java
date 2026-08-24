package com.financegaming.dto;

import com.financegaming.domain.GameState;
import com.financegaming.domain.PlayerState;
import com.financegaming.domain.SpectatorState;

import java.util.List;

public record LobbyResponse(
        String gameId,
        String roomCode,
        List<PlayerState> players,
        List<SpectatorState> spectators,
        GameState state,
        String playerId,
        String sessionToken,
        String role
) {
    /** Back-compat for clients that omit sessionToken / role in tests */
    public LobbyResponse(String gameId, String roomCode, List<PlayerState> players, GameState state, String playerId) {
        this(gameId, roomCode, players, List.of(), state, playerId, null, "PLAYER");
    }

    public LobbyResponse(
            String gameId,
            String roomCode,
            List<PlayerState> players,
            GameState state,
            String playerId,
            String sessionToken
    ) {
        this(gameId, roomCode, players, List.of(), state, playerId, sessionToken, "PLAYER");
    }
}
