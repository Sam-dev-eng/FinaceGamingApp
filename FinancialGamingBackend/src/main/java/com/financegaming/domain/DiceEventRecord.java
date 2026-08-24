package com.financegaming.domain;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record DiceEventRecord(
        int roll,
        String name,
        String type,
        boolean applied,
        Long amount
) {
}
