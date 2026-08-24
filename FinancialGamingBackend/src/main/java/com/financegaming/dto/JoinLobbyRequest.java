package com.financegaming.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record JoinLobbyRequest(
        @NotBlank @Size(min = 3, max = 16) String roomCode,
        @NotBlank @Size(min = 2, max = 32) String playerName
) {
}
