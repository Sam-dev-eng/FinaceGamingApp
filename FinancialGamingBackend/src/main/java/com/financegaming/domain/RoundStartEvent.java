package com.financegaming.domain;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record RoundStartEvent(
        String type,
        String label,
        String description,
        long amount
) {
}
