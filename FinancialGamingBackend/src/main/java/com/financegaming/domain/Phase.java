package com.financegaming.domain;

public enum Phase {
    SURVIVAL(1),
    LOAN(2),
    DICE(3),
    NETWORTH(4);

    private final int value;

    Phase(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }

    public static Phase fromValue(int value) {
        for (Phase phase : values()) {
            if (phase.value == value) {
                return phase;
            }
        }
        throw new IllegalArgumentException("Unknown phase: " + value);
    }

    public Phase next() {
        return switch (this) {
            case SURVIVAL -> LOAN;
            case LOAN -> DICE;
            case DICE -> NETWORTH;
            case NETWORTH -> SURVIVAL;
        };
    }

    public boolean isSimultaneous() {
        return this == NETWORTH;
    }
}
