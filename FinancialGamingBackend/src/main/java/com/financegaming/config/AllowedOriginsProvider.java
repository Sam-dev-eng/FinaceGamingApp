package com.financegaming.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

/**
 * Resolves allowed browser origins for REST and WebSocket.
 * Set {@code CORS_ALLOWED_ORIGINS} in production (comma-separated Vercel URLs).
 */
@Component
public class AllowedOriginsProvider {

    private static final Logger log = LoggerFactory.getLogger(AllowedOriginsProvider.class);

    private final List<String> origins;

    public AllowedOriginsProvider(GameProperties properties, Environment environment) {
        String override = environment.getProperty("CORS_ALLOWED_ORIGINS");
        if (override != null && !override.isBlank()) {
            origins = Arrays.stream(override.split(","))
                    .map(String::trim)
                    .filter(origin -> !origin.isEmpty())
                    .toList();
            log.info("CORS origins loaded from CORS_ALLOWED_ORIGINS ({} origin(s))", origins.size());
        } else {
            origins = List.copyOf(properties.corsAllowedOrigins());
            if (origins.isEmpty()) {
                log.warn("No CORS origins configured — set CORS_ALLOWED_ORIGINS in production");
            }
        }
    }

    public List<String> origins() {
        return origins;
    }

    public String[] asArray() {
        return origins.toArray(String[]::new);
    }
}
