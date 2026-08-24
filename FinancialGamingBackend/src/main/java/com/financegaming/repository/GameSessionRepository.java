package com.financegaming.repository;

import com.financegaming.domain.GameSession;

import java.util.Optional;

/**
 * Game persistence port — swap {@link GameRepository} for Redis/Postgres in production.
 */
public interface GameSessionRepository {

    GameSession save(GameSession session);

    Optional<GameSession> findById(String gameId);

    Optional<GameSession> findByRoomCode(String roomCode);

    void delete(String gameId);
}
