package com.financegaming.domain;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record BalanceChangeSummary(
        String id,
        String name,
        long cash,
        long loan,
        long netWorth,
        List<RoundStartEvent> events
) {
}
