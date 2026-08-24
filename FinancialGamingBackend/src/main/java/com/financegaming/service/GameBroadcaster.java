package com.financegaming.service;

import com.financegaming.config.GameProperties;
import com.financegaming.domain.FinalResultsPayload;
import com.financegaming.domain.GameState;
import com.financegaming.dto.GameMessage;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class GameBroadcaster {

    private final SimpMessagingTemplate messagingTemplate;

    public GameBroadcaster(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void broadcastState(String gameId, GameState state) {
        send(gameId, GameMessage.of("GAME_STATE", state));
    }

    public void broadcastLobby(String gameId, GameState state) {
        send(gameId, GameMessage.of("LOBBY_UPDATED", state));
    }

    public void broadcastPlayerRemoved(String gameId, String playerId, String playerName) {
        send(gameId, GameMessage.of("PLAYER_REMOVED", java.util.Map.of(
                "playerId", playerId,
                "playerName", playerName != null ? playerName : ""
        )));
    }

    public void broadcastGameStarted(String gameId, GameState state) {
        send(gameId, GameMessage.of("GAME_STARTED", state));
    }

    public void broadcastGameEnded(String gameId, FinalResultsPayload results) {
        send(gameId, GameMessage.of("GAME_ENDED", results));
        send(gameId, GameMessage.of("FINAL_RESULTS", results));
    }

    public void broadcastError(String gameId, String message) {
        send(gameId, GameMessage.of("ERROR", message));
    }

    private void send(String gameId, GameMessage<?> message) {
        messagingTemplate.convertAndSend("/topic/game/" + gameId, message);
    }
}
