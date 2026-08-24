package com.financegaming.controller;

import com.financegaming.domain.GameSession;
import com.financegaming.domain.PlayerState;
import com.financegaming.domain.SpectatorState;
import com.financegaming.dto.CreateLobbyRequest;
import com.financegaming.dto.GameActionRequest;
import com.financegaming.dto.JoinLobbyRequest;
import com.financegaming.dto.LeaveLobbyRequest;
import com.financegaming.dto.LobbyResponse;
import com.financegaming.dto.RemovePlayerRequest;
import com.financegaming.dto.RejoinRequest;
import com.financegaming.dto.SpectateLobbyRequest;
import com.financegaming.dto.StartGameRequest;
import com.financegaming.infrastructure.PlayerSessionStore;
import com.financegaming.service.GameService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/lobby")
public class LobbyController {

    private final GameService gameService;
    private final PlayerSessionStore sessionStore;

    public LobbyController(GameService gameService, PlayerSessionStore sessionStore) {
        this.gameService = gameService;
        this.sessionStore = sessionStore;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LobbyResponse createLobby(@Valid @RequestBody CreateLobbyRequest request) {
        GameSession session = gameService.createLobby(request.hostName());
        return toResponse(session, request.hostName());
    }

    @PostMapping("/join")
    public LobbyResponse joinLobby(@Valid @RequestBody JoinLobbyRequest request) {
        GameSession session = gameService.joinLobby(request.roomCode(), request.playerName());
        return toResponse(session, request.playerName());
    }

    @PostMapping("/spectate")
    public LobbyResponse spectateLobby(@Valid @RequestBody SpectateLobbyRequest request) {
        GameSession session = gameService.spectateRoom(request.roomCode(), request.spectatorName());
        SpectatorState spectator = session.findSpectatorByName(request.spectatorName());
        return toResponseForMember(session, spectator != null ? spectator.id() : null, "SPECTATOR");
    }

    @PostMapping("/{gameId}/fill-bots")
    public LobbyResponse fillBots(@PathVariable String gameId) {
        GameSession session = gameService.fillBots(gameId);
        return toResponse(session, null);
    }

    @PostMapping("/{gameId}/ready-all")
    public LobbyResponse readyAll(@PathVariable String gameId) {
        GameSession session = gameService.readyAll(gameId);
        return toResponse(session, null);
    }

    @PostMapping("/{gameId}/start")
    public LobbyResponse startGame(
            @PathVariable String gameId,
            @Valid @RequestBody StartGameRequest request
    ) {
        gameService.handleAction(new GameActionRequest(
                gameId,
                request.playerId(),
                "START_GAME",
                sessionStore.getToken(gameId, request.playerId()),
                null,
                null,
                null,
                null
        ));
        GameSession session = gameService.getGame(gameId);
        return toResponseForMember(session, request.playerId(), "PLAYER");
    }

    @GetMapping("/{gameId}")
    public LobbyResponse getLobby(@PathVariable String gameId) {
        GameSession session = gameService.getGame(gameId);
        return toResponse(session, null);
    }

    @GetMapping("/room/{roomCode}")
    public LobbyResponse getLobbyByRoom(@PathVariable String roomCode) {
        GameSession session = gameService.getLobbyByRoomCode(roomCode);
        return toResponse(session, null);
    }

    @PostMapping("/{gameId}/rejoin")
    public LobbyResponse rejoin(
            @PathVariable String gameId,
            @Valid @RequestBody RejoinRequest request
    ) {
        GameSession session = gameService.rejoin(gameId, request.sessionToken());
        String memberId = resolveMemberId(session, gameId, request.sessionToken());
        String role = session.findSpectator(memberId) != null ? "SPECTATOR" : "PLAYER";
        return toResponseForMember(session, memberId, role);
    }

    @PostMapping("/{gameId}/leave")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void leaveLobby(
            @PathVariable String gameId,
            @Valid @RequestBody LeaveLobbyRequest request
    ) {
        gameService.leaveLobby(gameId, request.playerId(), request.sessionToken());
    }

    @PostMapping("/{gameId}/remove-player")
    public LobbyResponse removePlayer(
            @PathVariable String gameId,
            @Valid @RequestBody RemovePlayerRequest request
    ) {
        GameSession session = gameService.removePlayer(
                gameId,
                request.hostPlayerId(),
                request.sessionToken(),
                request.targetPlayerId()
        );
        return toResponseForMember(session, request.hostPlayerId(), "PLAYER");
    }

    private String resolveMemberId(GameSession session, String gameId, String sessionToken) {
        for (PlayerState player : session.getPlayers()) {
            if (sessionToken.equals(sessionStore.getToken(gameId, player.id()))) {
                return player.id();
            }
        }
        for (SpectatorState spectator : session.getSpectators()) {
            if (sessionToken.equals(sessionStore.getToken(gameId, spectator.id()))) {
                return spectator.id();
            }
        }
        return null;
    }

    private LobbyResponse toResponse(GameSession session, String joinedName) {
        String playerId = joinedName != null
                ? session.getPlayers().stream()
                        .filter(p -> p.name().equalsIgnoreCase(joinedName))
                        .map(PlayerState::id)
                        .findFirst()
                        .orElse(null)
                : null;
        return toResponseForMember(session, playerId, "PLAYER");
    }

    private LobbyResponse toResponseForMember(GameSession session, String memberId, String role) {
        String sessionToken = memberId != null
                ? sessionStore.getToken(session.getGameId(), memberId)
                : null;
        return new LobbyResponse(
                session.getGameId(),
                session.getRoomCode(),
                session.getPlayers(),
                session.getSpectators(),
                session.toState(),
                memberId,
                sessionToken,
                role
        );
    }
}
