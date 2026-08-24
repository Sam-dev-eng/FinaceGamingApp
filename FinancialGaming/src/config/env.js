const parseEnvSeconds = (key, fallback) => {
  const raw = import.meta.env[key];
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const formatDurationLabel = (totalSeconds) => {
  if (totalSeconds >= 60) {
    const minutes = totalSeconds / 60;
    return minutes === 1 ? "1 minute" : `${minutes} minutes`;
  }
  return totalSeconds === 1 ? "1 second" : `${totalSeconds} seconds`;
};

/** Per-turn limit — VITE_TURN_TIMEOUT_SECONDS in .env */
export const TURN_TIMEOUT_SECONDS = parseEnvSeconds("VITE_TURN_TIMEOUT_SECONDS", 10);

/** Round intro auto-dismiss — VITE_ROUND_INTRO_TIMEOUT_SECONDS in .env */
export const ROUND_INTRO_TIMEOUT_SECONDS = parseEnvSeconds(
  "VITE_ROUND_INTRO_TIMEOUT_SECONDS",
  120
);

export const formatTurnTime = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

export const formatTurnTimeoutLabel = () => formatDurationLabel(TURN_TIMEOUT_SECONDS);

export const formatRoundIntroTimeoutLabel = () =>
  formatDurationLabel(ROUND_INTRO_TIMEOUT_SECONDS);
