package com.financegaming.application.handlers;

import com.financegaming.action.ActionContext;
import com.financegaming.action.GameAction;
import com.financegaming.action.GameActionHandler;
import com.financegaming.application.GameCommandPort;
import org.springframework.stereotype.Component;

@Component
class SetReadyHandler implements GameActionHandler {

    private final GameCommandPort commands;

    public SetReadyHandler(GameCommandPort commands) {
        this.commands = commands;
    }

    @Override
    public GameAction action() {
        return GameAction.SET_READY;
    }

    @Override
    public void handle(ActionContext context) {
        commands.setReady(context.session(), context.request().playerId());
    }
}

@Component
class StartGameHandler implements GameActionHandler {

    private final GameCommandPort commands;

    StartGameHandler(GameCommandPort commands) {
        this.commands = commands;
    }

    @Override
    public GameAction action() {
        return GameAction.START_GAME;
    }

    @Override
    public void handle(ActionContext context) {
        commands.startGame(context.session(), context.request().playerId());
    }
}

@Component
class EnterGameHandler implements GameActionHandler {

    private final GameCommandPort commands;

    EnterGameHandler(GameCommandPort commands) {
        this.commands = commands;
    }

    @Override
    public GameAction action() {
        return GameAction.ENTER_GAME;
    }

    @Override
    public void handle(ActionContext context) {
        commands.enterGame(context.session(), context.request().playerId());
    }
}

@Component
class SelectHousingHandler implements GameActionHandler {

    private final GameCommandPort commands;

    SelectHousingHandler(GameCommandPort commands) {
        this.commands = commands;
    }

    @Override
    public GameAction action() {
        return GameAction.SELECT_HOUSING;
    }

    @Override
    public void handle(ActionContext context) {
        commands.selectHousing(context.session(), context.request().playerId(), context.request().rentType());
    }
}

@Component
class PaySurvivalHandler implements GameActionHandler {

    private final GameCommandPort commands;

    PaySurvivalHandler(GameCommandPort commands) {
        this.commands = commands;
    }

    @Override
    public GameAction action() {
        return GameAction.PAY_SURVIVAL;
    }

    @Override
    public void handle(ActionContext context) {
        commands.paySurvival(context.session(), context.request().playerId(), context.request().rentDiceRoll());
    }
}

@Component
class PayLoanHandler implements GameActionHandler {

    private final GameCommandPort commands;

    PayLoanHandler(GameCommandPort commands) {
        this.commands = commands;
    }

    @Override
    public GameAction action() {
        return GameAction.PAY_LOAN;
    }

    @Override
    public void handle(ActionContext context) {
        commands.payLoan(context.session(), context.request().playerId(), context.request().loanAmount());
    }
}

@Component
class RollDiceHandler implements GameActionHandler {

    private final GameCommandPort commands;

    RollDiceHandler(GameCommandPort commands) {
        this.commands = commands;
    }

    @Override
    public GameAction action() {
        return GameAction.ROLL_DICE;
    }

    @Override
    public void handle(ActionContext context) {
        commands.rollDice(context.session(), context.request().playerId(), context.request().diceRoll());
    }
}

@Component
class DismissRoundStartHandler implements GameActionHandler {

    private final GameCommandPort commands;

    DismissRoundStartHandler(GameCommandPort commands) {
        this.commands = commands;
    }

    @Override
    public GameAction action() {
        return GameAction.DISMISS_ROUND_START;
    }

    @Override
    public void handle(ActionContext context) {
        commands.dismissRoundStart(context.session(), context.request().playerId());
    }
}

@Component
class SkipLoanHandler implements GameActionHandler {

    private final GameCommandPort commands;

    SkipLoanHandler(GameCommandPort commands) {
        this.commands = commands;
    }

    @Override
    public GameAction action() {
        return GameAction.SKIP_LOAN;
    }

    @Override
    public void handle(ActionContext context) {
        commands.skipLoan(context.session(), context.request().playerId());
    }
}

@Component
class BorrowFromBankHandler implements GameActionHandler {

    private final GameCommandPort commands;

    BorrowFromBankHandler(GameCommandPort commands) {
        this.commands = commands;
    }

    @Override
    public GameAction action() {
        return GameAction.BORROW_FROM_BANK;
    }

    @Override
    public void handle(ActionContext context) {
        commands.borrowFromBank(context.session(), context.request().playerId(), context.request().loanAmount());
    }
}
