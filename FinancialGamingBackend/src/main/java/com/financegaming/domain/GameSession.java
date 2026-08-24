package com.financegaming.domain;

import com.financegaming.engine.GameConstants;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

public class GameSession {

    private final String gameId;
    private final String roomCode;
    private final int totalRounds;
    private final List<PlayerState> players = new ArrayList<>();
    private final List<SpectatorState> spectators = new ArrayList<>();

    private GameStage gameStage = GameStage.LOBBY;
    private int round = 1;
    private Phase phase = Phase.SURVIVAL;
    private int turnIndex = 0;
    private String lastEventMessage;
    private boolean roundStartOpen;
    private List<BalanceChangeSummary> roundStartSummary = List.of();
    private boolean resolvingSimultaneous;
    private List<BalanceChangeSummary> simultaneousUpdates = List.of();
    private boolean diceSettling;
    private Instant turnDeadline;
    private Instant phaseDeadline;
    private int turnTimeoutSeconds = 10;
    private long roundStartDurationMs = 60_000;
    private long diceResultDelayMs = 4_000;

    public GameSession(String roomCode, int totalRounds) {
        this.gameId = UUID.randomUUID().toString();
        this.roomCode = roomCode;
        this.totalRounds = totalRounds;
    }

    public static GameSession createLobby(String roomCode, int totalRounds) {
        return new GameSession(roomCode, totalRounds);
    }

    public String getGameId() {
        return gameId;
    }

    public String getRoomCode() {
        return roomCode;
    }

    public int getTotalRounds() {
        return totalRounds;
    }

    public List<PlayerState> getPlayers() {
        return List.copyOf(players);
    }

    public List<SpectatorState> getSpectators() {
        return List.copyOf(spectators);
    }

    public GameStage getGameStage() {
        return gameStage;
    }

    public void setGameStage(GameStage gameStage) {
        this.gameStage = gameStage;
    }

    public int getRound() {
        return round;
    }

    public void setRound(int round) {
        this.round = round;
    }

    public Phase getPhase() {
        return phase;
    }

    public void setPhase(Phase phase) {
        this.phase = phase;
    }

    public int getTurnIndex() {
        return turnIndex;
    }

    public void setTurnIndex(int turnIndex) {
        this.turnIndex = turnIndex;
    }

    public String getLastEventMessage() {
        return lastEventMessage;
    }

    public void setLastEventMessage(String lastEventMessage) {
        this.lastEventMessage = lastEventMessage;
    }

    public boolean isRoundStartOpen() {
        return roundStartOpen;
    }

    public void setRoundStartOpen(boolean roundStartOpen) {
        this.roundStartOpen = roundStartOpen;
    }

    public List<BalanceChangeSummary> getRoundStartSummary() {
        return roundStartSummary;
    }

    public void setRoundStartSummary(List<BalanceChangeSummary> roundStartSummary) {
        this.roundStartSummary = roundStartSummary;
    }

    public boolean isResolvingSimultaneous() {
        return resolvingSimultaneous;
    }

    public void setResolvingSimultaneous(boolean resolvingSimultaneous) {
        this.resolvingSimultaneous = resolvingSimultaneous;
    }

    public List<BalanceChangeSummary> getSimultaneousUpdates() {
        return simultaneousUpdates;
    }

    public void setSimultaneousUpdates(List<BalanceChangeSummary> simultaneousUpdates) {
        this.simultaneousUpdates = simultaneousUpdates;
    }

    public boolean isDiceSettling() {
        return diceSettling;
    }

    public void setDiceSettling(boolean diceSettling) {
        this.diceSettling = diceSettling;
    }

    public Instant getTurnDeadline() {
        return turnDeadline;
    }

    public void setTurnDeadline(Instant turnDeadline) {
        this.turnDeadline = turnDeadline;
    }

    public Instant getPhaseDeadline() {
        return phaseDeadline;
    }

    public void setPhaseDeadline(Instant phaseDeadline) {
        this.phaseDeadline = phaseDeadline;
    }

    public int getTurnTimeoutSeconds() {
        return turnTimeoutSeconds;
    }

    public long getRoundStartDurationMs() {
        return roundStartDurationMs;
    }

    public long getDiceResultDelayMs() {
        return diceResultDelayMs;
    }

    public void applyTimingConfig(int turnTimeoutSeconds, long roundStartDurationMs, long diceResultDelayMs) {
        this.turnTimeoutSeconds = turnTimeoutSeconds;
        this.roundStartDurationMs = roundStartDurationMs;
        this.diceResultDelayMs = diceResultDelayMs;
    }

    public void clearTurnDeadline() {
        this.turnDeadline = null;
    }

    public void clearPhaseDeadline() {
        this.phaseDeadline = null;
    }

    public PlayerState getCurrentPlayer() {
        if (players.isEmpty()) {
            return null;
        }
        return players.get(turnIndex);
    }

    public PlayerState findPlayer(String playerId) {
        return players.stream()
                .filter(p -> p.id().equals(playerId))
                .findFirst()
                .orElse(null);
    }

    public int playerIndex(String playerId) {
        for (int i = 0; i < players.size(); i++) {
            if (players.get(i).id().equals(playerId)) {
                return i;
            }
        }
        return -1;
    }

    public boolean isFull() {
        return players.size() >= GameConstants.PLAYER_COUNT;
    }

    public boolean allReady() {
        return players.size() == GameConstants.PLAYER_COUNT
                && players.stream().allMatch(p -> p.status() == PlayerStatus.READY);
    }

    public PlayerState findHumanByName(String name) {
        if (name == null || name.isBlank()) {
            return null;
        }
        return players.stream()
                .filter(p -> !p.bot() && p.name().equalsIgnoreCase(name.trim()))
                .findFirst()
                .orElse(null);
    }

    public int findFirstBotSeatIndex() {
        for (int i = 0; i < players.size(); i++) {
            if (players.get(i).bot()) {
                return i;
            }
        }
        return -1;
    }

    public long humanCount() {
        return players.stream().filter(p -> !p.bot()).count();
    }

    public SpectatorState findSpectator(String spectatorId) {
        if (spectatorId == null) {
            return null;
        }
        return spectators.stream()
                .filter(s -> s.id().equals(spectatorId))
                .findFirst()
                .orElse(null);
    }

    public SpectatorState findSpectatorByName(String name) {
        if (name == null || name.isBlank()) {
            return null;
        }
        return spectators.stream()
                .filter(s -> s.name().equalsIgnoreCase(name.trim()))
                .findFirst()
                .orElse(null);
    }

    public SpectatorState addSpectator(String name) {
        String trimmed = name.trim();
        int seat = spectators.size() + 1;
        SpectatorState spectator = new SpectatorState(
                "spectator-" + seat + "-" + UUID.randomUUID().toString().substring(0, 8),
                trimmed,
                true
        );
        spectators.add(spectator);
        return spectator;
    }

    public void updateSpectator(int index, SpectatorState spectator) {
        spectators.set(index, spectator);
    }

    public void updateSpectatorById(String spectatorId, SpectatorState spectator) {
        for (int i = 0; i < spectators.size(); i++) {
            if (spectators.get(i).id().equals(spectatorId)) {
                spectators.set(i, spectator);
                return;
            }
        }
    }

    public int spectatorIndex(String spectatorId) {
        for (int i = 0; i < spectators.size(); i++) {
            if (spectators.get(i).id().equals(spectatorId)) {
                return i;
            }
        }
        return -1;
    }

    public PlayerState removePlayerById(String playerId) {
        if (gameStage != GameStage.LOBBY) {
            throw new IllegalStateException("Cannot remove players after the game has started");
        }
        int index = playerIndex(playerId);
        if (index < 0) {
            throw new IllegalArgumentException("Player not found");
        }
        PlayerState removed = players.remove(index);
        reindexSeats();
        ensureHostAssigned();
        return removed;
    }

    public SpectatorState removeSpectatorById(String spectatorId) {
        int index = spectatorIndex(spectatorId);
        if (index < 0) {
            throw new IllegalArgumentException("Spectator not found");
        }
        return spectators.remove(index);
    }

    public boolean isEmpty() {
        return players.isEmpty() && spectators.isEmpty();
    }

    private void reindexSeats() {
        for (int i = 0; i < players.size(); i++) {
            PlayerState player = players.get(i);
            if (player.seatIndex() != i) {
                players.set(i, PlayerStates.withSeatIndex(player, i));
            }
        }
    }

    private void ensureHostAssigned() {
        if (players.isEmpty()) {
            return;
        }
        boolean hasHost = players.stream().anyMatch(PlayerState::host);
        if (!hasHost) {
            players.set(0, PlayerStates.withHost(players.get(0), true));
        }
    }

    /** Lowest player-N slot not currently occupied (avoids duplicate ids after a removal). */
    private int findVacantPlayerSlot() {
        for (int slot = 1; slot <= GameConstants.PLAYER_COUNT; slot++) {
            if (playerIndex("player-" + slot) < 0) {
                return slot;
            }
        }
        throw new IllegalStateException("No vacant player slot");
    }

    private PlayerState insertPlayer(PlayerState player, int slot) {
        int insertIndex = Math.min(slot - 1, players.size());
        if (insertIndex >= players.size()) {
            players.add(player);
        } else {
            players.add(insertIndex, player);
        }
        reindexSeats();
        return player;
    }

    /** Replace a bot seat with a human — used when real players join a practice-filled lobby. */
    public PlayerState replaceSeatWithHuman(int seatIndex, String name) {
        if (gameStage != GameStage.LOBBY) {
            throw new IllegalStateException("Game already started");
        }
        if (seatIndex < 0 || seatIndex >= players.size() || !players.get(seatIndex).bot()) {
            throw new IllegalStateException("No bot seat available to replace");
        }
        PlayerState human = PlayerStates.createHuman(
                "player-" + (seatIndex + 1),
                name.trim(),
                false,
                seatIndex
        );
        players.set(seatIndex, human);
        return human;
    }

    public PlayerState addHumanPlayer(String name, boolean host) {
        if (isFull()) {
            throw new IllegalStateException("Lobby is full");
        }
        if (gameStage != GameStage.LOBBY) {
            throw new IllegalStateException("Game already started");
        }

        int slot = findVacantPlayerSlot();
        int seat = Math.min(slot - 1, players.size());
        PlayerState player = PlayerStates.createHuman("player-" + slot, name, host, seat);
        return insertPlayer(player, slot);
    }

    public PlayerState addBotPlayer(String name) {
        if (isFull()) {
            throw new IllegalStateException("Lobby is full");
        }
        if (gameStage != GameStage.LOBBY) {
            throw new IllegalStateException("Game already started");
        }

        int slot = findVacantPlayerSlot();
        int seat = Math.min(slot - 1, players.size());
        PlayerState player = PlayerStates.createBot("player-" + slot, name, seat);
        return insertPlayer(player, slot);
    }

    /** @deprecated use {@link #addHumanPlayer} */
    public PlayerState addPlayer(String name, boolean host) {
        return host ? addHumanPlayer(name, true) : addHumanPlayer(name, false);
    }

    public void updatePlayer(int index, PlayerState player) {
        players.set(index, player);
    }

    public void updatePlayerById(String playerId, PlayerState player) {
        int index = playerIndex(playerId);
        if (index >= 0) {
            players.set(index, player);
        }
    }

    public int randomDiceRoll() {
        return ThreadLocalRandom.current().nextInt(1, 7);
    }

    public GameState toState() {
        PlayerState current = getCurrentPlayer();
        return new GameState(
                gameId,
                roomCode,
                gameStage,
                round,
                phase,
                turnIndex,
                List.copyOf(players),
                List.copyOf(spectators),
                lastEventMessage,
                roundStartOpen,
                roundStartSummary,
                resolvingSimultaneous,
                simultaneousUpdates,
                totalRounds,
                diceSettling,
                current != null ? current.id() : null,
                turnTimeoutSeconds,
                roundStartDurationMs,
                diceResultDelayMs,
                turnDeadline != null ? turnDeadline.toEpochMilli() : null,
                phaseDeadline != null ? phaseDeadline.toEpochMilli() : null
        );
    }

    public FinalResultsPayload toFinalResults(String viewerPlayerId) {
        return new FinalResultsPayload(gameId, totalRounds, viewerPlayerId, List.copyOf(players));
    }
}
