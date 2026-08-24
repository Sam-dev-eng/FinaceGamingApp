package com.financegaming.application;

import com.financegaming.domain.GameSession;

/**
 * Port for in-game commands — implemented by {@link com.financegaming.service.GameService}.
 * Action handlers depend on this interface, not the full service surface.
 */
public interface GameCommandPort {

    void setReady(GameSession session, String playerId);

    void startGame(GameSession session, String playerId);

    void enterGame(GameSession session, String playerId);

    void selectHousing(GameSession session, String playerId, String rentType);

    void paySurvival(GameSession session, String playerId, Integer rentDiceRoll);

    void payLoan(GameSession session, String playerId, Long loanAmount);

    void skipLoan(GameSession session, String playerId);

    void borrowFromBank(GameSession session, String playerId, Long amount);

    void rollDice(GameSession session, String playerId, Integer diceRoll);

    void dismissRoundStart(GameSession session, String playerId);
}
