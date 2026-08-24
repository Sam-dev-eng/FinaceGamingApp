package com.financegaming.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record GameMessage<T>(String type, T payload) {

    public static <T> GameMessage<T> of(String type, T payload) {
        return new GameMessage<>(type, payload);
    }
}
