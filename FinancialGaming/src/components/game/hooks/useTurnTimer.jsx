import { useEffect, useState } from "react";
import { formatTurnTime } from "../../../config/env";

/** Countdown synced to a server-provided epoch-ms deadline. */
export const useTurnTimer = (deadlineEpochMs, enabled = true, resetKey = "") => {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!enabled || !deadlineEpochMs) {
      setSecondsLeft(0);
      return;
    }

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadlineEpochMs - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };

    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [enabled, deadlineEpochMs, resetKey]);

  return {
    secondsLeft,
    formattedTime: formatTurnTime(secondsLeft),
  };
};

/** Countdown for round-start / phase modals. */
export const usePhaseTimer = (deadlineEpochMs, enabled = true, resetKey = "") =>
  useTurnTimer(deadlineEpochMs, enabled, resetKey);

export const formatTimeoutLabel = (totalSeconds) => {
  if (totalSeconds >= 60) {
    const minutes = Math.round(totalSeconds / 60);
    return minutes === 1 ? "1 minute" : `${minutes} minutes`;
  }
  return totalSeconds === 1 ? "1 second" : `${totalSeconds} seconds`;
};
