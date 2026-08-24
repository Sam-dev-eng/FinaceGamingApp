package com.financegaming.infrastructure;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Issues and validates opaque session tokens per (gameId, playerId).
 * Replace with JWT or Redis-backed sessions for multi-node production.
 */
@Component
public class PlayerSessionStore {

    private final Map<String, String> tokenByPlayerKey = new ConcurrentHashMap<>();

    public String issueToken(String gameId, String playerId) {
        String key = playerKey(gameId, playerId);
        return tokenByPlayerKey.computeIfAbsent(key, ignored -> UUID.randomUUID().toString());
    }

    /** Returns existing token or creates one — safe for idempotent join/rejoin. */
    public String getOrIssueToken(String gameId, String playerId) {
        return issueToken(gameId, playerId);
    }

    public void verify(String gameId, String playerId, String token) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("sessionToken is required");
        }
        String expected = tokenByPlayerKey.get(playerKey(gameId, playerId));
        if (expected == null || !expected.equals(token)) {
            throw new IllegalStateException("Invalid or expired session token");
        }
    }

    public void revokeToken(String gameId, String playerId) {
        tokenByPlayerKey.remove(playerKey(gameId, playerId));
    }

    /** Removes every session token issued for a game (players and spectators). */
    public void revokeAllForGame(String gameId) {
        String prefix = gameId + ":";
        tokenByPlayerKey.keySet().removeIf(key -> key.startsWith(prefix));
    }

    public String getToken(String gameId, String playerId) {
        return tokenByPlayerKey.get(playerKey(gameId, playerId));
    }

    private static String playerKey(String gameId, String playerId) {
        return gameId + ":" + playerId;
    }
}
