package com.financegaming.dto;

import jakarta.validation.constraints.NotBlank;

public record RemovePlayerRequest(
        @NotBlank String hostPlayerId,
        @NotBlank String sessionToken,
        @NotBlank String targetPlayerId
) {
}
