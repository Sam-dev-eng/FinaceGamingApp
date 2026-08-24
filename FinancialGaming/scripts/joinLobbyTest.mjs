/**
 * Verify human join scenarios — run against backend on :8080
 */
const API = "http://localhost:8080";

const api = async (path, options = {}) => {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    ...options,
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`${path} ${res.status}: ${body?.detail ?? text}`);
  return body;
};

async function run() {
  // Scenario 1: host + friend join (no bots)
  const lobby1 = await api("/api/lobby", {
    method: "POST",
    body: JSON.stringify({ hostName: "Host" }),
  });
  const j1 = await api("/api/lobby/join", {
    method: "POST",
    body: JSON.stringify({ roomCode: lobby1.roomCode, playerName: "Friend" }),
  });
  console.assert(j1.players.length === 2, "Expected 2 players after friend join");

  // Idempotent rejoin same name
  const j1b = await api("/api/lobby/join", {
    method: "POST",
    body: JSON.stringify({ roomCode: lobby1.roomCode, playerName: "Friend" }),
  });
  console.assert(j1b.players.length === 2, "Idempotent join should not add duplicate");

  // Scenario 2: host + bots, friend displaces bot
  const lobby2 = await api("/api/lobby", {
    method: "POST",
    body: JSON.stringify({ hostName: "Host2" }),
  });
  await api(`/api/lobby/${lobby2.gameId}/fill-bots`, { method: "POST" });
  const full = await api(`/api/lobby/${lobby2.gameId}`);
  console.assert(full.players.length === 3, "Bots should fill lobby");

  const j2 = await api("/api/lobby/join", {
    method: "POST",
    body: JSON.stringify({ roomCode: lobby2.roomCode, playerName: "RealPlayer" }),
  });
  console.assert(j2.players.length === 3, "Still 3 after bot replacement");
  console.assert(
    j2.players.some((p) => p.name === "RealPlayer" && !p.bot),
    "Real player should be in lobby"
  );

  // Scenario 3: three humans — idempotent double-join keeps the same token
  const lobby3 = await api("/api/lobby", {
    method: "POST",
    body: JSON.stringify({ hostName: "Host3" }),
  });
  const p2 = await api("/api/lobby/join", {
    method: "POST",
    body: JSON.stringify({ roomCode: lobby3.roomCode, playerName: "Player2" }),
  });
  const p3first = await api("/api/lobby/join", {
    method: "POST",
    body: JSON.stringify({ roomCode: lobby3.roomCode, playerName: "Player3" }),
  });
  const p3second = await api("/api/lobby/join", {
    method: "POST",
    body: JSON.stringify({ roomCode: lobby3.roomCode, playerName: "Player3" }),
  });
  console.assert(
    p3first.sessionToken === p3second.sessionToken,
    "Idempotent join must keep the same session token"
  );
  await api("/api/game/action", {
    method: "POST",
    body: JSON.stringify({
      gameId: lobby3.gameId,
      playerId: p3second.playerId,
      action: "SET_READY",
      sessionToken: p3first.sessionToken,
    }),
  });
  console.log("✅ Player 3 ready with original token after double join");

  console.log("✅ Join scenarios passed");
}

run().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
