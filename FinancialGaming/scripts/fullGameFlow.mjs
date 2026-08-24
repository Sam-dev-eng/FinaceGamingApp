/**
 * Full 4-round game via REST API — catches housing, all phases, and game completion.
 * Run: node scripts/fullGameFlow.mjs
 */
const API = process.env.VITE_API_URL ?? "http://localhost:8080";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const api = async (path, options = {}) => {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${path} failed: ${res.status} ${text}`);
  }
  return res.json();
};

const action = (gameId, playerId, sessionToken, body) =>
  api("/api/game/action", {
    method: "POST",
    body: JSON.stringify({ gameId, playerId, sessionToken, ...body }),
  });

const getState = async (gameId) => {
  const lobby = await api(`/api/lobby/${gameId}`);
  return lobby.state;
};

const waitFor = async (gameId, predicate, timeoutMs = 30000, label = "condition") => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const state = await getState(gameId);
    if (predicate(state)) return state;
    await sleep(300);
  }
  const finalState = await getState(gameId);
  throw new Error(
    `Timeout: ${label}. stage=${finalState.gameStage} phase=${finalState.phase} round=${finalState.round} turn=${finalState.turnIndex}`
  );
};

const minLoanForRound = (round) =>
  Math.round(150_000 * Math.pow(1.1, round - 1));

async function run() {
  console.log("API:", API);

  const lobby = await api("/api/lobby", {
    method: "POST",
    body: JSON.stringify({ hostName: "YOU" }),
  });
  const { gameId, playerId, sessionToken } = lobby;
  console.log("✓ Lobby", lobby.roomCode);

  await api(`/api/lobby/${gameId}/fill-bots`, { method: "POST" });
  await api(`/api/lobby/${gameId}/ready-all`, { method: "POST" });

  await action(gameId, playerId, sessionToken, { action: "START_GAME" });
  let state = await waitFor(
    gameId,
    (s) => s.gameStage === "HOUSING",
    10000,
    "housing stage"
  );
  console.log("✓ Game started in HOUSING");

  // Simulate arriving on game screen after case study
  await action(gameId, playerId, sessionToken, { action: "ENTER_GAME" });
  state = await getState(gameId);
  const me = state.players.find((p) => p.id === playerId);
  if (!me?.rentType && state.turnIndex === me?.seatIndex) {
    await action(gameId, playerId, sessionToken, { action: "SELECT_HOUSING", rentType: "PARENTS" });
    console.log("✓ Human selected PARENTS housing");
  }

  state = await waitFor(
    gameId,
    (s) => s.gameStage === "PLAYING",
    20000,
    "housing complete"
  );
  console.log("✓ Housing complete → PLAYING");

  for (let round = 1; round <= 4; round++) {
    state = await waitFor(
      gameId,
      (s) => s.round === round && s.gameStage === "PLAYING",
      15000,
      `round ${round}`
    );

    if (state.roundStartOpen) {
      await action(gameId, playerId, sessionToken, { action: "DISMISS_ROUND_START" });
      await sleep(400);
    }

    // Survival — human turn
    state = await waitFor(
      gameId,
      (s) => s.phase === "SURVIVAL" && s.players[s.turnIndex]?.id === playerId,
      30000,
      `round ${round} survival turn`
    );
    const human = state.players.find((p) => p.id === playerId);
    const rentRoll = human?.rentType === "PARENTS" ? 4 : undefined;
    await action(gameId, playerId, sessionToken, {
      action: "PAY_SURVIVAL",
      ...(rentRoll != null ? { rentDiceRoll: rentRoll } : {}),
    });
    console.log(`✓ Round ${round} survival paid`);

    state = await waitFor(gameId, (s) => s.phase === "LOAN", 30000, `round ${round} loan phase`);
    state = await waitFor(
      gameId,
      (s) => s.phase === "LOAN" && s.players[s.turnIndex]?.id === playerId,
      30000,
      `round ${round} loan turn`
    );
    await action(gameId, playerId, sessionToken, {
      action: "PAY_LOAN",
      loanAmount: minLoanForRound(round),
    });
    console.log(`✓ Round ${round} loan paid`);

    state = await waitFor(gameId, (s) => s.phase === "DICE", 30000, `round ${round} dice phase`);
    state = await waitFor(
      gameId,
      (s) => s.phase === "DICE" && s.players[s.turnIndex]?.id === playerId,
      30000,
      `round ${round} dice turn`
    );
    await action(gameId, playerId, sessionToken, { action: "ROLL_DICE", diceRoll: 4 });
    console.log(`✓ Round ${round} dice rolled`);

    if (round < 4) {
      await waitFor(
        gameId,
        (s) => s.round === round + 1 || s.gameStage === "COMPLETE",
        30000,
        `round ${round} → next`
      );
    }
  }

  state = await waitFor(
    gameId,
    (s) => s.gameStage === "COMPLETE",
    45000,
    "game complete"
  );
  console.log("✓ Game complete after 4 rounds");

  const ranked = [...state.players].sort(
    (a, b) => b.cash - b.loan - (a.cash - a.loan)
  );
  ranked.forEach((p, i) => {
    console.log(
      `  #${i + 1} ${p.name}: net ₦${(p.cash - p.loan).toLocaleString()}`
    );
  });

  console.log("\n✅ Full game flow passed\n");
}

run().catch((err) => {
  console.error("\n❌ Full game test failed:", err.message);
  process.exit(1);
});
