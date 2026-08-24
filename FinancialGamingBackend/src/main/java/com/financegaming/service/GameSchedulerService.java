package com.financegaming.service;

import com.financegaming.config.GameProperties;
import com.financegaming.domain.GameSession;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.*;

@Service
public class GameSchedulerService {

    private final ScheduledExecutorService executor = Executors.newScheduledThreadPool(4);
    private final Map<String, ScheduledFuture<?>> turnTasks = new ConcurrentHashMap<>();
    private final Map<String, ScheduledFuture<?>> phaseTasks = new ConcurrentHashMap<>();

    private final GameService gameService;
    private final GameProperties properties;

    public GameSchedulerService(@Lazy GameService gameService, GameProperties properties) {
        this.gameService = gameService;
        this.properties = properties;
    }

    public void scheduleTurnTimeout(GameSession session) {
        cancelTurn(session.getGameId());
        session.clearTurnDeadline();
        if (session.getGameStage() == com.financegaming.domain.GameStage.COMPLETE) {
            return;
        }
        if (session.isRoundStartOpen() || session.isResolvingSimultaneous() || session.isDiceSettling()) {
            return;
        }

        session.setTurnDeadline(Instant.now().plusSeconds(properties.turnTimeoutSeconds()));
        ScheduledFuture<?> task = executor.schedule(
                () -> gameService.onTurnTimeout(session.getGameId()),
                properties.turnTimeoutSeconds(),
                TimeUnit.SECONDS
        );
        turnTasks.put(session.getGameId(), task);
    }

    public void scheduleRoundStartTimeout(GameSession session) {
        cancelPhase(session.getGameId());
        session.setPhaseDeadline(Instant.now().plusMillis(properties.roundStartDurationMs()));
        ScheduledFuture<?> task = executor.schedule(
                () -> gameService.onRoundStartTimeout(session.getGameId()),
                properties.roundStartDurationMs(),
                TimeUnit.MILLISECONDS
        );
        phaseTasks.put(session.getGameId() + ":roundStart", task);
    }

    public void scheduleSimultaneousPhase(GameSession session) {
        cancelPhase(session.getGameId());
        session.setPhaseDeadline(Instant.now().plusMillis(properties.netWorthPhaseDurationMs()));
        ScheduledFuture<?> task = executor.schedule(
                () -> gameService.onSimultaneousPhaseTimeout(session.getGameId()),
                properties.netWorthPhaseDurationMs(),
                TimeUnit.MILLISECONDS
        );
        phaseTasks.put(session.getGameId() + ":simultaneous", task);
    }

    public void scheduleDiceSettle(GameSession session) {
        cancelTurn(session.getGameId());
        session.setTurnDeadline(Instant.now().plusMillis(properties.diceResultDelayMs()));
        ScheduledFuture<?> task = executor.schedule(
                () -> gameService.onDiceSettleTimeout(session.getGameId()),
                properties.diceResultDelayMs(),
                TimeUnit.MILLISECONDS
        );
        turnTasks.put(session.getGameId() + ":dice", task);
    }

    public void cancelAll(String gameId) {
        cancelTurn(gameId);
        cancelPhase(gameId);
        cancelCleanup(gameId);
    }

    public void scheduleCompletedGameCleanup(String gameId) {
        cancelCleanup(gameId);
        long delayMs = Math.max(properties.completedGameRetentionMs(), 1_000L);
        ScheduledFuture<?> task = executor.schedule(
                () -> gameService.destroyCompletedGame(gameId),
                delayMs,
                TimeUnit.MILLISECONDS
        );
        phaseTasks.put(gameId + ":cleanup", task);
    }

    private void cancelTurn(String gameId) {
        ScheduledFuture<?> turn = turnTasks.remove(gameId);
        if (turn != null) {
            turn.cancel(false);
        }
        ScheduledFuture<?> dice = turnTasks.remove(gameId + ":dice");
        if (dice != null) {
            dice.cancel(false);
        }
    }

    private void cancelPhase(String gameId) {
        ScheduledFuture<?> roundStart = phaseTasks.remove(gameId + ":roundStart");
        if (roundStart != null) {
            roundStart.cancel(false);
        }
        ScheduledFuture<?> simultaneous = phaseTasks.remove(gameId + ":simultaneous");
        if (simultaneous != null) {
            simultaneous.cancel(false);
        }
    }

    private void cancelCleanup(String gameId) {
        ScheduledFuture<?> cleanup = phaseTasks.remove(gameId + ":cleanup");
        if (cleanup != null) {
            cleanup.cancel(false);
        }
    }
}
