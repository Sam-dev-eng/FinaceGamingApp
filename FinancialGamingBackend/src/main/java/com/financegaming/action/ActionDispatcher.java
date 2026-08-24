package com.financegaming.action;

import com.financegaming.domain.GameSession;
import com.financegaming.dto.GameActionRequest;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Component
public class ActionDispatcher {

    private final Map<GameAction, GameActionHandler> handlers;

    public ActionDispatcher(List<GameActionHandler> handlerList) {
        this.handlers = new EnumMap<>(GameAction.class);
        for (GameActionHandler handler : handlerList) {
            GameActionHandler previous = handlers.put(handler.action(), handler);
            if (previous != null) {
                throw new IllegalStateException("Duplicate handler for action: " + handler.action());
            }
        }
    }

    public void dispatch(GameSession session, GameActionRequest request) {
        if (request.playerId() == null || request.action() == null) {
            throw new IllegalArgumentException("playerId and action are required");
        }

        GameAction action = GameAction.fromString(request.action());
        GameActionHandler handler = handlers.get(action);
        if (handler == null) {
            throw new IllegalArgumentException("No handler registered for action: " + action);
        }

        handler.handle(new ActionContext(session, request));
    }
}
