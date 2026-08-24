package com.financegaming.action;

import com.financegaming.domain.GameSession;
import com.financegaming.dto.GameActionRequest;

/** Immutable context passed to every action handler. */
public record ActionContext(GameSession session, GameActionRequest request) {
}
