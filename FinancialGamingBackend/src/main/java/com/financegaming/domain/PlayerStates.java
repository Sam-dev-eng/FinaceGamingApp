package com.financegaming.domain;

import com.financegaming.engine.GameConstants;

import java.util.ArrayList;
import java.util.List;

/** Factory and copy helpers for {@link PlayerState} — keeps handlers concise. */
public final class PlayerStates {

    private PlayerStates() {
    }

    public static PlayerState createHuman(
            String id,
            String name,
            boolean host,
            int seatIndex
    ) {
        return new PlayerState(
                id,
                name,
                GameConstants.STARTING_CASH,
                GameConstants.STARTING_LOAN,
                GameConstants.STARTING_CREDIT_SCORE,
                null,
                false,
                0,
                null,
                new ArrayList<>(),
                null,
                null,
                PlayerStatus.WAITING,
                host,
                seatIndex,
                false,
                true
        );
    }

    public static PlayerState createBot(String id, String name, int seatIndex) {
        return new PlayerState(
                id,
                name,
                GameConstants.STARTING_CASH,
                GameConstants.STARTING_LOAN,
                GameConstants.STARTING_CREDIT_SCORE,
                null,
                false,
                0,
                null,
                new ArrayList<>(),
                null,
                null,
                PlayerStatus.WAITING,
                false,
                seatIndex,
                true,
                true
        );
    }

    public static PlayerState withStatus(PlayerState player, PlayerStatus status) {
        return copy(player, player.rentType(), status, player.connected());
    }

    public static PlayerState withRentType(PlayerState player, HousingType rentType) {
        return copy(player, rentType, player.status(), player.connected());
    }

    public static PlayerState withConnected(PlayerState player, boolean connected) {
        return copy(player, player.rentType(), player.status(), connected);
    }

    public static PlayerState withHost(PlayerState player, boolean host) {
        return new PlayerState(
                player.id(),
                player.name(),
                player.cash(),
                player.loan(),
                player.creditScore(),
                player.rentType(),
                player.skipNextSalary(),
                player.investment6PayoutsLeft(),
                player.lastDiceEvent(),
                player.roundHistory(),
                player.pendingRound(),
                player.roundStartEvents(),
                player.status(),
                host,
                player.seatIndex(),
                player.bot(),
                player.connected()
        );
    }

    public static PlayerState withSeatIndex(PlayerState player, int seatIndex) {
        return new PlayerState(
                player.id(),
                player.name(),
                player.cash(),
                player.loan(),
                player.creditScore(),
                player.rentType(),
                player.skipNextSalary(),
                player.investment6PayoutsLeft(),
                player.lastDiceEvent(),
                player.roundHistory(),
                player.pendingRound(),
                player.roundStartEvents(),
                player.status(),
                player.host(),
                seatIndex,
                player.bot(),
                player.connected()
        );
    }

    public static PlayerState copy(
            PlayerState player,
            HousingType rentType,
            PlayerStatus status,
            boolean connected
    ) {
        return new PlayerState(
                player.id(),
                player.name(),
                player.cash(),
                player.loan(),
                player.creditScore(),
                rentType,
                player.skipNextSalary(),
                player.investment6PayoutsLeft(),
                player.lastDiceEvent(),
                player.roundHistory(),
                player.pendingRound(),
                player.roundStartEvents(),
                status,
                player.host(),
                player.seatIndex(),
                player.bot(),
                connected
        );
    }

    public static PlayerState copyFinancials(PlayerState player) {
        return new PlayerState(
                player.id(),
                player.name(),
                player.cash(),
                player.loan(),
                player.creditScore(),
                player.rentType(),
                player.skipNextSalary(),
                player.investment6PayoutsLeft(),
                player.lastDiceEvent(),
                player.roundHistory(),
                player.pendingRound(),
                player.roundStartEvents(),
                player.status(),
                player.host(),
                player.seatIndex(),
                player.bot(),
                player.connected()
        );
    }
}
