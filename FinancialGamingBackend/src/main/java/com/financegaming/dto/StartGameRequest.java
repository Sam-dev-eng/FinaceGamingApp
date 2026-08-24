package com.financegaming.dto;

import jakarta.validation.constraints.NotBlank;

public record StartGameRequest(@NotBlank String playerId) {
}
