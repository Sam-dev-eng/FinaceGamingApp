package com.financegaming.domain;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record SpectatorState(
        String id,
        String name,
        boolean connected
) {
}
