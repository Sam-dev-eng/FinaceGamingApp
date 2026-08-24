package com.financegaming.dto;

import jakarta.validation.constraints.NotBlank;

public record SpectateLobbyRequest(
        @NotBlank String roomCode,
        @NotBlank String spectatorName
) {
}
