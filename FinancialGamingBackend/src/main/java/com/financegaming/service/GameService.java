package com.financegaming.service;

import com.financegaming.action.ActionDispatcher;
import com.financegaming.application.GameCommandPort;
import com.financegaming.config.GameProperties;
import com.financegaming.domain.*;
import com.financegaming.dto.GameActionRequest;
import com.financegaming.engine.CreditScoreLogic;
import com.financegaming.engine.GameConstants;
import com.financegaming.engine.PlayerLogic;
import com.financegaming.engine.RentCalculator;
import com.financegaming.infrastructure.PlayerSessionStore;
import com.financegaming.repository.GameRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class GameService implements GameCommandPort {

    private static final Logger log = LoggerFactory.getLogger(GameService.class);

    private final GameRepository repository;
    private final GameBroadcaster broadcaster;
    private final GameSchedulerService scheduler;
    private final GameProperties properties;
    private final ActionDispatcher actionDispatcher;
    private final PlayerSessionStore sessionStore;

    public GameService(
            GameRepository repository,
            GameBroadcaster broadcaster,
            GameSchedulerService scheduler,
            GameProperties properties,
            @Lazy ActionDispatcher actionDispatcher,
            PlayerSessionStore sessionStore
    ) {
        this.repository = repository;
        this.broadcaster = broadcaster;
        this.scheduler = scheduler;
        this.properties = properties;
        this.actionDispatcher = actionDispatcher;
        this.sessionStore = sessionStore;
    }

    public GameSession createLobby(String hostName) {
        String roomCode = generateRoomCode();
        GameSession session = GameSession.createLobby(roomCode, properties.totalRounds());
        session.applyTimingConfig(
                properties.turnTimeoutSeconds(),
                properties.roundStartDurationMs(),
                properties.diceResultDelayMs()
        );
        session.addHumanPlayer(hostName, true);
        repository.save(session);
        PlayerState host = session.getPlayers().get(0);
        sessionStore.issueToken(session.getGameId(), host.id());
        broadcaster.broadcastLobby(session.getGameId(), session.toState());
        return session;
    }

    public String issueSessionToken(String gameId, String playerId) {
        return sessionStore.issueToken(gameId, playerId);
    }

    public GameSession rejoin(String gameId, String sessionToken) {
        GameSession session = getGame(gameId);
        synchronized (session) {
            for (PlayerState player : session.getPlayers()) {
                if (sessionToken.equals(sessionStore.getToken(gameId, player.id()))) {
                    session.updatePlayerById(player.id(), PlayerStates.withConnected(player, true));
                    repository.save(session);
                    broadcaster.broadcastLobby(session.getGameId(), session.toState());
                    return session;
                }
            }
            for (SpectatorState spectator : session.getSpectators()) {
                if (sessionToken.equals(sessionStore.getToken(gameId, spectator.id()))) {
                    session.updateSpectatorById(
                            spectator.id(),
                            new SpectatorState(spectator.id(), spectator.name(), true)
                    );
                    repository.save(session);
                    broadcaster.broadcastLobby(session.getGameId(), session.toState());
                    return session;
                }
            }
            throw new IllegalStateException("Invalid session token");
        }
    }

    public GameSession spectateRoom(String roomCode, String spectatorName) {
        GameSession session = repository.findByRoomCode(roomCode.trim().toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Room not found: " + roomCode));

        synchronized (session) {
            String trimmedName = spectatorName.trim();

            SpectatorState existing = session.findSpectatorByName(trimmedName);
            if (existing != null) {
                sessionStore.issueToken(session.getGameId(), existing.id());
                session.updateSpectatorById(
                        existing.id(),
                        new SpectatorState(existing.id(), existing.name(), true)
                );
                repository.save(session);
                broadcaster.broadcastLobby(session.getGameId(), session.toState());
                return session;
            }

            SpectatorState joined = session.addSpectator(trimmedName);
            sessionStore.issueToken(session.getGameId(), joined.id());
            repository.save(session);
            broadcaster.broadcastLobby(session.getGameId(), session.toState());
            return session;
        }
    }

    public GameSession joinLobby(String roomCode, String playerName) {
        GameSession session = repository.findByRoomCode(roomCode)
                .orElseThrow(() -> new IllegalArgumentException("Lobby not found: " + roomCode));

        synchronized (session) {
            if (session.getGameStage() != GameStage.LOBBY) {
                throw new IllegalStateException("Game already started");
            }

            String trimmedName = playerName.trim();

            // Idempotent rejoin — prevents duplicate seats from double-submit / React Strict Mode
            PlayerState existing = session.findHumanByName(trimmedName);
            if (existing != null) {
                sessionStore.issueToken(session.getGameId(), existing.id());
                session.updatePlayerById(existing.id(), PlayerStates.withConnected(existing, true));
                repository.save(session);
                broadcaster.broadcastLobby(session.getGameId(), session.toState());
                return session;
            }

            PlayerState joined;
            if (session.isFull()) {
                int botSeat = session.findFirstBotSeatIndex();
                if (botSeat < 0) {
                    throw new IllegalStateException(
                            "Lobby is full — waiting for a player to leave before you can join"
                    );
                }
                joined = session.replaceSeatWithHuman(botSeat, trimmedName);
            } else {
                joined = session.addHumanPlayer(trimmedName, false);
            }

            sessionStore.issueToken(session.getGameId(), joined.id());
            repository.save(session);
            broadcaster.broadcastLobby(session.getGameId(), session.toState());
            return session;
        }
    }

    public GameSession fillBots(String gameId) {
        GameSession session = getGame(gameId);
        synchronized (session) {
            if (session.getGameStage() != GameStage.LOBBY) {
                throw new IllegalStateException("Game already started");
            }
            String[] botNames = {"Opponent A", "Opponent B"};
            int botIndex = 0;
            while (!session.isFull() && botIndex < botNames.length) {
                session.addBotPlayer(botNames[botIndex++]);
            }
            repository.save(session);
            broadcaster.broadcastLobby(session.getGameId(), session.toState());
            return session;
        }
    }

    public GameSession readyAll(String gameId) {
        GameSession session = getGame(gameId);
        synchronized (session) {
            for (int i = 0; i < session.getPlayers().size(); i++) {
                PlayerState player = session.getPlayers().get(i);
                session.updatePlayer(i, PlayerStates.withStatus(player, PlayerStatus.READY));
            }
            repository.save(session);
            broadcaster.broadcastLobby(session.getGameId(), session.toState());
            return session;
        }
    }

    public void leaveLobby(String gameId, String memberId, String sessionToken) {
        GameSession session = getGame(gameId);
        synchronized (session) {
            if (session.getGameStage() != GameStage.LOBBY) {
                throw new IllegalStateException("Cannot leave after the game has started");
            }
            sessionStore.verify(gameId, memberId, sessionToken);

            SpectatorState spectator = session.findSpectator(memberId);
            if (spectator != null) {
                session.removeSpectatorById(memberId);
                sessionStore.revokeToken(gameId, memberId);
                persistOrDeleteLobby(session);
                return;
            }

            PlayerState player = session.findPlayer(memberId);
            if (player == null) {
                throw new IllegalArgumentException("Player not found in lobby");
            }

            session.removePlayerById(memberId);
            sessionStore.revokeToken(gameId, memberId);
            persistOrDeleteLobby(session);
        }
    }

    public GameSession removePlayer(
            String gameId,
            String hostPlayerId,
            String sessionToken,
            String targetPlayerId
    ) {
        GameSession session = getGame(gameId);
        synchronized (session) {
            if (session.getGameStage() != GameStage.LOBBY) {
                throw new IllegalStateException("Cannot remove players after the game has started");
            }
            sessionStore.verify(gameId, hostPlayerId, sessionToken);

            PlayerState host = requirePlayer(session, hostPlayerId);
            if (!host.host()) {
                throw new IllegalStateException("Only the host can remove players");
            }
            if (hostPlayerId.equals(targetPlayerId)) {
                throw new IllegalStateException("Use leave lobby to exit yourself");
            }

            PlayerState target = session.findPlayer(targetPlayerId);
            if (target == null) {
                throw new IllegalArgumentException("Player not found in lobby");
            }
            if (target.host()) {
                throw new IllegalStateException("Cannot remove the host");
            }

            session.removePlayerById(targetPlayerId);
            sessionStore.revokeToken(gameId, targetPlayerId);
            repository.save(session);
            broadcaster.broadcastPlayerRemoved(session.getGameId(), targetPlayerId, target.name());
            broadcaster.broadcastLobby(session.getGameId(), session.toState());
            return session;
        }
    }

    private void persistOrDeleteLobby(GameSession session) {
        if (session.isEmpty()) {
            destroyGame(session);
            return;
        }
        repository.save(session);
        broadcaster.broadcastLobby(session.getGameId(), session.toState());
    }

    /** Drops a finished game from memory after final results have been delivered. */
    public void destroyCompletedGame(String gameId) {
        GameSession session = repository.findById(gameId).orElse(null);
        if (session == null) {
            return;
        }
        synchronized (session) {
            if (session.getGameStage() != GameStage.COMPLETE) {
                return;
            }
            destroyGame(session);
        }
    }

    private void destroyGame(GameSession session) {
        String gameId = session.getGameId();
        scheduler.cancelAll(gameId);
        sessionStore.revokeAllForGame(gameId);
        repository.delete(gameId);
        log.info("Removed game room {} ({}) from memory", gameId, session.getRoomCode());
    }

    public GameSession getGame(String gameId) {
        return repository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found: " + gameId));
    }

    public GameSession getLobbyByRoomCode(String roomCode) {
        return repository.findByRoomCode(roomCode)
                .orElseThrow(() -> new IllegalArgumentException("Lobby not found: " + roomCode));
    }

    public void handleAction(GameActionRequest request) {
        GameSession session = getGame(request.gameId());

        synchronized (session) {
            if (session.findSpectator(request.playerId()) != null) {
                throw new IllegalStateException("Spectators cannot perform game actions");
            }
            sessionStore.verify(request.gameId(), request.playerId(), request.sessionToken());
            actionDispatcher.dispatch(session, request);
        }
    }

    public void onTurnTimeout(String gameId) {
        GameSession session = getGame(gameId);
        synchronized (session) {
            if (session.isDiceSettling() || session.isRoundStartOpen() || session.isResolvingSimultaneous()) {
                return;
            }
            autoPlayCurrentTurn(session);
        }
    }

    public void onRoundStartTimeout(String gameId) {
        GameSession session = getGame(gameId);
        synchronized (session) {
            if (session.isRoundStartOpen()) {
                dismissRoundStartInternal(session);
            }
        }
    }

    public void onSimultaneousPhaseTimeout(String gameId) {
        GameSession session = getGame(gameId);
        synchronized (session) {
            if (session.isResolvingSimultaneous()) {
                finishSimultaneousPhase(session);
            }
        }
    }

    public void onDiceSettleTimeout(String gameId) {
        GameSession session = getGame(gameId);
        synchronized (session) {
            if (session.isDiceSettling()) {
                session.setDiceSettling(false);
                advanceTurn(session);
                repository.save(session);
                scheduler.scheduleTurnTimeout(session);
                publishState(session);
            }
        }
    }

    @Override
    public void setReady(GameSession session, String playerId) {
        PlayerState player = requirePlayer(session, playerId);
        if (session.getGameStage() != GameStage.LOBBY) {
            throw new IllegalStateException("Game already started");
        }
        session.updatePlayerById(playerId, PlayerStates.withStatus(player, PlayerStatus.READY));
        repository.save(session);
        broadcaster.broadcastLobby(session.getGameId(), session.toState());
    }

    @Override
    public void startGame(GameSession session, String playerId) {
        PlayerState host = requirePlayer(session, playerId);
        if (!host.host()) {
            throw new IllegalStateException("Only the host can start the game");
        }
        if (!session.allReady()) {
            throw new IllegalStateException("All players must be ready");
        }

        session.setGameStage(GameStage.HOUSING);
        session.setTurnIndex(0);
        session.setPhase(Phase.SURVIVAL);
        session.setLastEventMessage(null);

        List<PlayerState> playing = new ArrayList<>();
        for (PlayerState p : session.getPlayers()) {
            playing.add(PlayerStates.withStatus(p, PlayerStatus.PLAYING));
        }
        for (int i = 0; i < playing.size(); i++) {
            session.updatePlayer(i, playing.get(i));
        }

        repository.save(session);
        broadcaster.broadcastGameStarted(session.getGameId(), session.toState());
    }

    @Override
    public void enterGame(GameSession session, String playerId) {
        requirePlayer(session, playerId);

        if (session.getGameStage() == GameStage.HOUSING) {
            advanceBotsThroughHousing(session);
            repository.save(session);
            if (session.getGameStage() == GameStage.HOUSING) {
                scheduler.scheduleTurnTimeout(session);
            }
        }

        publishState(session);
    }

    private void advanceBotsThroughHousing(GameSession session) {
        int safety = 0;
        while (session.getGameStage() == GameStage.HOUSING && safety++ < GameConstants.PLAYER_COUNT) {
            PlayerState current = session.getCurrentPlayer();
            if (current == null || !isBotPlayer(current)) {
                break;
            }
            if (current.rentType() != null) {
                advanceTurn(session);
                if (session.getTurnIndex() == 0) {
                    completeHousingSetup(session);
                }
                continue;
            }
            autoHousing(session, current);
        }
    }

    private boolean isBotPlayer(PlayerState player) {
        return player.bot();
    }

    @Override
    public void selectHousing(GameSession session, String playerId, String rentType) {
        assertTurn(session, playerId);
        if (session.getGameStage() != GameStage.HOUSING) {
            throw new IllegalStateException("Not in housing setup");
        }

        HousingType housing = HousingType.fromString(rentType);
        if (housing == null) {
            throw new IllegalArgumentException("Invalid housing type: " + rentType);
        }

        PlayerState player = requirePlayer(session, playerId);
        session.updatePlayer(session.playerIndex(playerId), PlayerStates.withRentType(player, housing));
        session.setLastEventMessage(player.name() + " selected " + housing.name());

        advanceTurn(session);

        if (session.getGameStage() == GameStage.HOUSING) {
            advanceBotsThroughHousing(session);
        }

        if (session.getGameStage() == GameStage.HOUSING) {
            repository.save(session);
            scheduler.scheduleTurnTimeout(session);
            publishState(session);
        }
    }

    @Override
    public void paySurvival(GameSession session, String playerId, Integer rentDiceRoll) {
        assertTurn(session, playerId);
        assertPlayingPhase(session, Phase.SURVIVAL);

        PlayerState player = requirePlayer(session, playerId);
        PlayerLogic.SurvivalResult result = PlayerLogic.applySurvival(player, session.getRound(), rentDiceRoll);
        session.updatePlayer(session.playerIndex(playerId), result.player());
        session.setLastEventMessage(result.message());

        advanceTurn(session);
        repository.save(session);
        scheduler.scheduleTurnTimeout(session);
        publishState(session);
    }

    @Override
    public void payLoan(GameSession session, String playerId, Long loanAmount) {
        assertTurn(session, playerId);
        assertPlayingPhase(session, Phase.LOAN);

        if (loanAmount == null || loanAmount <= 0) {
            throw new IllegalArgumentException("Loan amount must be positive");
        }

        PlayerState player = requirePlayer(session, playerId);
        if (player.loan() <= 0) {
            throw new IllegalStateException("No outstanding loan balance");
        }

        long maxPay = Math.min(player.cash(), player.loan());
        if (loanAmount > maxPay) {
            throw new IllegalArgumentException("Cannot pay more than loan balance or available cash");
        }

        long minPay = GameConstants.getMinimumLoanPayment(session.getRound());
        long loanBefore = player.loan();
        PlayerState updated = PlayerLogic.applyLoan(player, loanAmount, session.getRound());
        int newCredit = CreditScoreLogic.afterLoanPayment(
                player.creditScore(), loanAmount, minPay, loanBefore, updated.loan());
        updated = PlayerLogic.withCreditScore(updated, newCredit);

        session.updatePlayer(session.playerIndex(playerId), updated);
        session.setLastEventMessage(String.format("%s paid ₦%,d on loan", player.name(), loanAmount));

        advanceTurn(session);
        repository.save(session);
        scheduler.scheduleTurnTimeout(session);
        publishState(session);
    }

    @Override
    public void skipLoan(GameSession session, String playerId) {
        assertTurn(session, playerId);
        assertPlayingPhase(session, Phase.LOAN);

        PlayerState player = requirePlayer(session, playerId);
        if (player.loan() <= 0) {
            session.setLastEventMessage(player.name() + " has no loan — continuing");
            advanceTurn(session);
            repository.save(session);
            scheduler.scheduleTurnTimeout(session);
            publishState(session);
            return;
        }

        int newCredit = CreditScoreLogic.afterSkipLoan(player.creditScore());
        PlayerState updated = PlayerLogic.applySkipLoan(player, session.getRound(), newCredit);

        session.updatePlayer(session.playerIndex(playerId), updated);
        session.setLastEventMessage(player.name() + " skipped loan payment this round");

        advanceTurn(session);
        repository.save(session);
        scheduler.scheduleTurnTimeout(session);
        publishState(session);
    }

    @Override
    public void borrowFromBank(GameSession session, String playerId, Long amount) {
        assertTurn(session, playerId);
        if (session.getGameStage() != GameStage.PLAYING) {
            throw new IllegalStateException("Bank is only available during gameplay");
        }
        if (session.isRoundStartOpen()) {
            throw new IllegalStateException("Cannot borrow during round briefing");
        }
        if (session.getPhase() == Phase.NETWORTH) {
            throw new IllegalStateException("Cannot borrow during net worth update");
        }

        if (amount == null || amount <= 0) {
            throw new IllegalArgumentException("Borrow amount must be positive");
        }

        PlayerState player = requirePlayer(session, playerId);
        PlayerState updated = PlayerLogic.applyBankBorrow(player, amount);

        session.updatePlayer(session.playerIndex(playerId), updated);
        session.setLastEventMessage(String.format("%s borrowed ₦%,d from the bank", player.name(), amount));

        repository.save(session);
        publishState(session);
    }

    @Override
    public void rollDice(GameSession session, String playerId, Integer diceRoll) {
        assertTurn(session, playerId);
        assertPlayingPhase(session, Phase.DICE);

        if (session.isDiceSettling()) {
            throw new IllegalStateException("Waiting for dice result to settle");
        }

        PlayerState player = requirePlayer(session, playerId);
        int roll = diceRoll != null ? diceRoll : session.randomDiceRoll();
        if (roll < 1 || roll > 6) {
            throw new IllegalArgumentException("Dice roll must be between 1 and 6");
        }

        PlayerLogic.DiceResult result = PlayerLogic.applyDice(player, roll, session.getRound());
        session.updatePlayer(session.playerIndex(playerId), result.player());
        session.setLastEventMessage(result.message());
        session.setDiceSettling(true);

        repository.save(session);
        scheduler.scheduleDiceSettle(session);
        publishState(session);
    }

    @Override
    public void dismissRoundStart(GameSession session, String playerId) {
        requirePlayer(session, playerId);
        if (!session.isRoundStartOpen()) {
            return;
        }
        dismissRoundStartInternal(session);
    }

    private void dismissRoundStartInternal(GameSession session) {
        session.setRoundStartOpen(false);
        session.clearPhaseDeadline();
        session.setRoundStartSummary(List.of());

        for (int i = 0; i < session.getPlayers().size(); i++) {
            PlayerState p = session.getPlayers().get(i);
            session.updatePlayer(i, new PlayerState(
                    p.id(), p.name(), p.cash(), p.loan(), p.creditScore(), p.rentType(),
                    p.skipNextSalary(), p.investment6PayoutsLeft(), p.lastDiceEvent(),
                    p.roundHistory(), p.pendingRound(), null,
                    p.status(), p.host(), p.seatIndex(), p.bot(), p.connected()
            ));
        }

        session.setTurnIndex(0);
        session.setPhase(Phase.SURVIVAL);
        repository.save(session);
        scheduler.scheduleTurnTimeout(session);
        publishState(session);
    }

    private void autoPlayCurrentTurn(GameSession session) {
        if (session.getGameStage() == GameStage.COMPLETE) {
            return;
        }

        PlayerState player = session.getCurrentPlayer();
        if (player == null) {
            return;
        }

        switch (session.getGameStage()) {
            case HOUSING -> autoHousing(session, player);
            case PLAYING -> autoPlaying(session, player);
            default -> {
            }
        }
    }

    private void autoHousing(GameSession session, PlayerState player) {
        if (player.rentType() != null) {
            advanceTurn(session);
            if (session.getTurnIndex() == 0) {
                completeHousingSetup(session);
            } else {
                scheduler.scheduleTurnTimeout(session);
                publishState(session);
            }
            return;
        }

        if (!isBotPlayer(player)) {
            return;
        }

        HousingType[] options = HousingType.values();
        HousingType picked = options[session.randomDiceRoll() % options.length];
        session.updatePlayer(session.getTurnIndex(), PlayerStates.withRentType(player, picked));
        session.setLastEventMessage(player.name() + " selected " + picked.name());
        advanceTurn(session);

        if (session.getGameStage() == GameStage.HOUSING) {
            advanceBotsThroughHousing(session);
        }

        if (session.getGameStage() == GameStage.HOUSING) {
            repository.save(session);
            scheduler.scheduleTurnTimeout(session);
            publishState(session);
        }
    }

    private void autoPlaying(GameSession session, PlayerState player) {
        if (!isBotPlayer(player)) {
            return;
        }

        switch (session.getPhase()) {
            case SURVIVAL -> {
                Integer rentRoll = player.requiresRentDice() ? session.randomDiceRoll() : null;
                PlayerState active = player;
                long rent = RentCalculator.calculateRoundRent(active, rentRoll);
                long totalCost = rent + GameConstants.SURVIVAL_COST;
                if (active.cash() < totalCost && CreditScoreLogic.canBorrow(active.creditScore())) {
                    long shortfall = totalCost - active.cash();
                    active = PlayerLogic.applyBankBorrow(active, shortfall);
                    session.updatePlayer(session.getTurnIndex(), active);
                }
                PlayerLogic.SurvivalResult result = PlayerLogic.applySurvival(active, session.getRound(), rentRoll);
                session.updatePlayer(session.getTurnIndex(), result.player());
                session.setLastEventMessage(player.name() + " auto-paid survival + rent");
                advanceTurn(session);
                repository.save(session);
                scheduler.scheduleTurnTimeout(session);
                publishState(session);
            }
            case LOAN -> {
                long amount = Math.min(
                        GameConstants.getMinimumLoanPayment(session.getRound()),
                        Math.min(player.cash(), player.loan())
                );
                if (amount > 0) {
                    long minPay = GameConstants.getMinimumLoanPayment(session.getRound());
                    long loanBefore = player.loan();
                    PlayerState updated = PlayerLogic.applyLoan(player, amount, session.getRound());
                    int newCredit = CreditScoreLogic.afterLoanPayment(
                            player.creditScore(), amount, minPay, loanBefore, updated.loan());
                    updated = PlayerLogic.withCreditScore(updated, newCredit);
                    session.updatePlayer(session.getTurnIndex(), updated);
                    session.setLastEventMessage(String.format("%s auto-paid minimum ₦%,d on loan", player.name(), amount));
                } else if (player.loan() > 0) {
                    int newCredit = CreditScoreLogic.afterSkipLoan(player.creditScore());
                    PlayerState updated = PlayerLogic.applySkipLoan(player, session.getRound(), newCredit);
                    session.updatePlayer(session.getTurnIndex(), updated);
                    session.setLastEventMessage(player.name() + " skipped loan payment");
                }
                advanceTurn(session);
                repository.save(session);
                scheduler.scheduleTurnTimeout(session);
                publishState(session);
            }
            case DICE -> {
                if (!session.isDiceSettling()) {
                    int roll = session.randomDiceRoll();
                    PlayerLogic.DiceResult result = PlayerLogic.applyDice(player, roll, session.getRound());
                    session.updatePlayer(session.getTurnIndex(), result.player());
                    session.setLastEventMessage(player.name() + " auto-rolled " + roll + " — " + result.message());
                    session.setDiceSettling(true);
                    repository.save(session);
                    scheduler.scheduleDiceSettle(session);
                    publishState(session);
                }
            }
            default -> {
            }
        }
    }

    private void completeHousingSetup(GameSession session) {
        session.setGameStage(GameStage.PLAYING);
        session.setPhase(Phase.SURVIVAL);
        session.setTurnIndex(0);
        session.setLastEventMessage(null);

        List<PlayerState> updated = new ArrayList<>();
        for (PlayerState player : session.getPlayers()) {
            PendingRound pending = PendingRound.empty(1, GameConstants.SALARY_PER_ROUND);
            List<RoundStartEvent> events = List.of(
                    new RoundStartEvent("gain", "Salary", "Already included in your starting cash", GameConstants.SALARY_PER_ROUND)
            );
            updated.add(new PlayerState(
                    player.id(), player.name(), player.cash(), player.loan(), player.creditScore(),
                    player.rentType(), player.skipNextSalary(), player.investment6PayoutsLeft(),
                    player.lastDiceEvent(), player.roundHistory(), pending, events,
                    player.status(), player.host(), player.seatIndex(), player.bot(), player.connected()
            ));
        }

        for (int i = 0; i < updated.size(); i++) {
            session.updatePlayer(i, updated.get(i));
        }

        openRoundStartSummary(session);
        repository.save(session);
        scheduler.scheduleRoundStartTimeout(session);
        publishState(session);
    }

    private void openRoundStartSummary(GameSession session) {
        List<BalanceChangeSummary> summaries = session.getPlayers().stream()
                .map(p -> new BalanceChangeSummary(
                        p.id(),
                        p.name(),
                        p.cash(),
                        p.loan(),
                        p.netWorth(),
                        p.roundStartEvents() != null ? p.roundStartEvents() : List.of()
                ))
                .toList();
        session.setRoundStartSummary(summaries);
        session.setRoundStartOpen(true);
    }

    private void advanceTurn(GameSession session) {
        if (session.isResolvingSimultaneous() || session.getPhase().isSimultaneous()) {
            return;
        }

        int current = session.getTurnIndex();
        int next = current < GameConstants.PLAYER_COUNT - 1 ? current + 1 : 0;

        if (current == GameConstants.PLAYER_COUNT - 1 && next == 0) {
            onTurnCycleComplete(session);
        } else {
            session.setTurnIndex(next);
        }
    }

    private void onTurnCycleComplete(GameSession session) {
        if (session.getGameStage() == GameStage.HOUSING) {
            completeHousingSetup(session);
            return;
        }

        if (session.getGameStage() != GameStage.PLAYING || session.isResolvingSimultaneous()) {
            return;
        }

        Phase next = session.getPhase().next();
        if (next.isSimultaneous()) {
            beginSimultaneousPhase(session, next);
        } else {
            session.setPhase(next);
            session.setTurnIndex(0);
        }
    }

    private void beginSimultaneousPhase(GameSession session, Phase phase) {
        session.setPhase(phase);
        session.setTurnIndex(0);
        session.setResolvingSimultaneous(true);

        if (phase == Phase.NETWORTH) {
            List<BalanceChangeSummary> summaries = new ArrayList<>();
            for (int i = 0; i < session.getPlayers().size(); i++) {
                PlayerState before = session.getPlayers().get(i);
                PlayerState after = PlayerLogic.applyNetWorthPhase(before);
                session.updatePlayer(i, after);

                RoundRecord last = after.roundHistory().isEmpty()
                        ? null
                        : after.roundHistory().get(after.roundHistory().size() - 1);

                List<RoundStartEvent> events;
                if (last != null && last.loanInterest() > 0) {
                    events = List.of(new RoundStartEvent(
                            "loss",
                            "Loan Interest (+10%)",
                            "Applied to remaining loan balance",
                            last.loanInterest()
                    ));
                } else {
                    events = List.of(new RoundStartEvent(
                            "neutral",
                            "No Loan Interest",
                            before.loan() > 0 ? "Loan paid off — no balance remaining" : "No outstanding loan",
                            0
                    ));
                }

                summaries.add(new BalanceChangeSummary(
                        after.id(), after.name(), after.cash(), after.loan(), after.netWorth(), events
                ));
            }

            session.setSimultaneousUpdates(summaries);
            session.setLastEventMessage("10% loan interest applied to all remaining loan balances");
        }

        repository.save(session);
        scheduler.scheduleSimultaneousPhase(session);
        publishState(session);
    }

    private void finishSimultaneousPhase(GameSession session) {
        session.setResolvingSimultaneous(false);
        session.setSimultaneousUpdates(List.of());
        session.setLastEventMessage(null);

        if (session.getRound() < session.getTotalRounds()) {
            int nextRound = session.getRound() + 1;
            session.setRound(nextRound);

            for (int i = 0; i < session.getPlayers().size(); i++) {
                PlayerState player = session.getPlayers().get(i);
                PlayerState updated = PlayerLogic.applyRoundStart(player);
                PendingRound pending = PendingRound.empty(nextRound, updated.skipNextSalary() ? 0 : GameConstants.SALARY_PER_ROUND);
                session.updatePlayer(i, new PlayerState(
                        updated.id(), updated.name(), updated.cash(), updated.loan(), updated.creditScore(),
                        updated.rentType(), updated.skipNextSalary(), updated.investment6PayoutsLeft(),
                        updated.lastDiceEvent(), updated.roundHistory(), pending, updated.roundStartEvents(),
                        updated.status(), updated.host(), updated.seatIndex(), updated.bot(), updated.connected()
                ));
            }

            openRoundStartSummary(session);
            session.setPhase(Phase.SURVIVAL);
            session.setTurnIndex(0);
            repository.save(session);
            scheduler.scheduleRoundStartTimeout(session);
            publishState(session);
            return;
        }

        session.setGameStage(GameStage.COMPLETE);
        repository.save(session);
        publishState(session);

        for (PlayerState player : session.getPlayers()) {
            broadcaster.broadcastGameEnded(session.getGameId(), session.toFinalResults(player.id()));
        }
        scheduler.scheduleCompletedGameCleanup(session.getGameId());
    }

    private void publishState(GameSession session) {
        broadcaster.broadcastState(session.getGameId(), session.toState());
    }

    private void assertTurn(GameSession session, String playerId) {
        PlayerState current = session.getCurrentPlayer();
        if (current == null || !current.id().equals(playerId)) {
            throw new IllegalStateException("Not your turn");
        }
    }

    private void assertPlayingPhase(GameSession session, Phase expected) {
        if (session.getGameStage() != GameStage.PLAYING || session.getPhase() != expected) {
            throw new IllegalStateException("Invalid phase for this action");
        }
        if (session.isRoundStartOpen() || session.isResolvingSimultaneous()) {
            throw new IllegalStateException("Game is resolving a simultaneous phase");
        }
    }

    private PlayerState requirePlayer(GameSession session, String playerId) {
        PlayerState player = session.findPlayer(playerId);
        if (player == null) {
            throw new IllegalArgumentException("Player not found: " + playerId);
        }
        return player;
    }

    private String generateRoomCode() {
        ThreadLocalRandom random = ThreadLocalRandom.current();
        String letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        char a = letters.charAt(random.nextInt(letters.length()));
        char b = letters.charAt(random.nextInt(letters.length()));
        char c = letters.charAt(random.nextInt(letters.length()));
        int digits = random.nextInt(100, 1000);
        return "%c%c%c-%d".formatted(a, b, c, digits);
    }
}
