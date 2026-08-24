import { GAME_STAGES, PHASES } from "../game/gameConstants";

const STAGE_MAP = {
  LOBBY: GAME_STAGES.LOBBY,
  HOUSING: GAME_STAGES.HOUSING,
  PLAYING: GAME_STAGES.PLAYING,
  COMPLETE: GAME_STAGES.COMPLETE,
};

const PHASE_MAP = {
  SURVIVAL: PHASES.SURVIVAL,
  LOAN: PHASES.LOAN,
  DICE: PHASES.DICE,
  NETWORTH: PHASES.NETWORTH,
};

const normalizeStage = (stage) => {
  if (!stage) return GAME_STAGES.LOBBY;
  if (typeof stage === "string" && stage === stage.toLowerCase()) {
    return stage;
  }
  return STAGE_MAP[stage] ?? stage.toLowerCase();
};

const normalizePhase = (phase) => {
  if (typeof phase === "number") return phase;
  return PHASE_MAP[phase] ?? PHASES.SURVIVAL;
};

const normalizePlayer = (player) => ({
  ...player,
  rentType: player.rentType ?? null,
  bot: player.bot ?? false,
  connected: player.connected ?? true,
  roundHistory: player.roundHistory ?? [],
});

export const normalizeGameState = (serverState, playerId) => {
  if (!serverState) return null;

  const players = (serverState.players ?? []).map(normalizePlayer);
  const myPlayer = playerId ? players.find((p) => p.id === playerId) ?? null : null;

  return {
    gameId: serverState.gameId,
    roomCode: serverState.roomCode,
    gameStage: normalizeStage(serverState.gameStage),
    round: serverState.round ?? 1,
    phase: normalizePhase(serverState.phase),
    turnIndex: serverState.turnIndex ?? 0,
    players,
    lastEventMessage: serverState.lastEventMessage ?? null,
    isRoundStartOpen: Boolean(serverState.roundStartOpen),
    roundStartSummary: serverState.roundStartSummary ?? [],
    isResolvingSimultaneous: Boolean(serverState.resolvingSimultaneous),
    simultaneousUpdates: serverState.simultaneousUpdates ?? [],
    totalRounds: serverState.totalRounds ?? 4,
    spectators: serverState.spectators ?? [],
    isDiceSettling: Boolean(serverState.diceSettling),
    currentPlayerId: serverState.currentPlayerId ?? null,
    myPlayerId: myPlayer?.id ?? playerId ?? null,
    mySeatIndex: myPlayer?.seatIndex ?? -1,
    turnTimeoutSeconds: serverState.turnTimeoutSeconds ?? 10,
    roundStartDurationMs: serverState.roundStartDurationMs ?? 60_000,
    diceResultDelayMs: serverState.diceResultDelayMs ?? 4_000,
    turnDeadlineEpochMs: serverState.turnDeadlineEpochMs ?? null,
    phaseDeadlineEpochMs: serverState.phaseDeadlineEpochMs ?? null,
  };
};

export const normalizeFinalResults = (payload, playerId) => ({
  gameId: payload.gameId,
  totalRounds: payload.totalRounds ?? 4,
  currentPlayerId: playerId ?? payload.currentPlayerId ?? "player-1",
  players: (payload.players ?? []).map(normalizePlayer),
});
