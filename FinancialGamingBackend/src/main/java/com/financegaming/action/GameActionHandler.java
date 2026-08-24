package com.financegaming.action;

/**
 * One handler per game action — register as a Spring bean.
 * Future features (e.g. bank borrowing) add a new handler without touching the dispatcher.
 */
public interface GameActionHandler {
    GameAction action();

    void handle(ActionContext context);
}
