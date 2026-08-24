package com.financegaming.repository;

import com.financegaming.domain.GameSession;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class GameRepository implements GameSessionRepository {

    private final Map<String, GameSession> byId = new ConcurrentHashMap<>();
    private final Map<String, String> roomCodeToId = new ConcurrentHashMap<>();

    public GameSession save(GameSession session) {
        byId.put(session.getGameId(), session);
        roomCodeToId.put(session.getRoomCode().toUpperCase(), session.getGameId());
        return session;
    }

    public Optional<GameSession> findById(String gameId) {
        return Optional.ofNullable(byId.get(gameId));
    }

    public Optional<GameSession> findByRoomCode(String roomCode) {
        String gameId = roomCodeToId.get(roomCode.toUpperCase());
        if (gameId == null) {
            return Optional.empty();
        }
        return findById(gameId);
    }

    public Collection<GameSession> findAll() {
        return byId.values();
    }

    public void delete(String gameId) {
        findById(gameId).ifPresent(session -> {
            roomCodeToId.remove(session.getRoomCode().toUpperCase());
            byId.remove(gameId);
        });
    }
}
