package com.financegaming.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateLobbyRequest(
        @NotBlank @Size(min = 2, max = 32) String hostName
) {
}
