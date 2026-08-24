package com.financegaming.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "finance-gaming")
public record GameProperties(
        int maxPlayers,
        int totalRounds,
        int turnTimeoutSeconds,
        long roundStartDurationMs,
        long netWorthPhaseDurationMs,
        long diceResultDelayMs,
        long completedGameRetentionMs,
        java.util.List<String> corsAllowedOrigins
) {
}
