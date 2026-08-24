package com.financegaming.dto;

import jakarta.validation.constraints.NotBlank;

public record LeaveLobbyRequest(
        @NotBlank String playerId,
        @NotBlank String sessionToken
) {
}
