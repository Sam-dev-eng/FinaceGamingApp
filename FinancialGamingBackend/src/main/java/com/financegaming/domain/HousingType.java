package com.financegaming.domain;

public enum HousingType {
    PARENTS,
    SHARED,
    SINGLE,
    LUXURY;

    public static HousingType fromString(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return HousingType.valueOf(value.trim().toUpperCase());
    }
}
