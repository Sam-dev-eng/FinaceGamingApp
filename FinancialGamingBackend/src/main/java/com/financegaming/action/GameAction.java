package com.financegaming.action;

import java.util.Arrays;

/**
 * Canonical game actions. Add new entries here (e.g. BORROW_FROM_BANK) and register a handler.
 */
public enum GameAction {
    SET_READY,
    START_GAME,
    ENTER_GAME,
    SELECT_HOUSING,
    PAY_SURVIVAL,
    PAY_LOAN,
    ROLL_DICE,
    DISMISS_ROUND_START,
    /** Skip student-loan payment for this round (optional). */
    SKIP_LOAN,
    /** Borrow cash from the bank — added to cash and loan balance. */
    BORROW_FROM_BANK;

    public static GameAction fromString(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("action is required");
        }
        try {
            return GameAction.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Unknown action: " + value);
        }
    }

    public static boolean isKnown(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }
        return Arrays.stream(values()).anyMatch(a -> a.name().equalsIgnoreCase(value.trim()));
    }
}
