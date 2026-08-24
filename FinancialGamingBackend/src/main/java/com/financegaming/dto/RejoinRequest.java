package com.financegaming.dto;

import jakarta.validation.constraints.NotBlank;

public record RejoinRequest(
        @NotBlank String sessionToken
) {
}
