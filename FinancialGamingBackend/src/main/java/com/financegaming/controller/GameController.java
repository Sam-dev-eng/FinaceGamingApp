package com.financegaming.controller;

import com.financegaming.domain.GameState;
import com.financegaming.dto.GameActionRequest;
import com.financegaming.service.GameService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/game")
public class GameController {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    /** REST fallback when WebSocket is unavailable */
    @PostMapping("/action")
    public GameState postAction(@Valid @RequestBody GameActionRequest request) {
        gameService.handleAction(request);
        return gameService.getGame(request.gameId()).toState();
    }
}
