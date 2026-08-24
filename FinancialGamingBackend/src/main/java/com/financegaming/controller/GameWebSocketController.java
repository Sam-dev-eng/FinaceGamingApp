package com.financegaming.controller;

import com.financegaming.dto.GameActionRequest;
import com.financegaming.service.GameBroadcaster;
import com.financegaming.service.GameService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

@Controller
public class GameWebSocketController {

    private static final Logger log = LoggerFactory.getLogger(GameWebSocketController.class);

    private final GameService gameService;
    private final GameBroadcaster broadcaster;

    public GameWebSocketController(GameService gameService, GameBroadcaster broadcaster) {
        this.gameService = gameService;
        this.broadcaster = broadcaster;
    }

    @MessageMapping("/game.action")
    public void handleAction(GameActionRequest request) {
        try {
            gameService.handleAction(request);
        } catch (Exception ex) {
            log.warn("Game action failed: {}", ex.getMessage());
            if (request.gameId() != null) {
                broadcaster.broadcastError(request.gameId(), ex.getMessage());
            }
        }
    }
}
