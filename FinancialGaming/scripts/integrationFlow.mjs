/**
 * Integration test — REST + WebSocket against Spring Boot backend.
 * Run: node scripts/integrationFlow.mjs
 * Requires backend: mvn spring-boot:run -Dspring-boot.run.profiles=dev
 */
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const API = process.env.VITE_API_URL ?? "http://localhost:8080";
const WS = process.env.VITE_WS_URL ?? `${API}/ws`;

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

const connectStomp = (gameId) =>
  new Promise((resolve, reject) => {
    const messages = [];
    const client = new Client({
      webSocketFactory: () => new SockJS(WS),
      debug: () => {},
      reconnectDelay: 0,
      onConnect: () => {
        client.subscribe(`/topic/game/${gameId}`, (msg) => {
          messages.push(JSON.parse(msg.body));
        });
        resolve({ client, messages });
      },
      onStompError: (f) => reject(new Error(f.headers?.message ?? "stomp error")),
    });
    client.activate();
  });

const sendAction = (client, action) => {
  client.publish({ destination: "/app/game.action", body: JSON.stringify(action) });
};

const waitFor = async (messages, predicate, timeoutMs = 15000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (messages.some(predicate)) return messages.find(predicate);
    await sleep(200);
  }
  throw new Error(`Timeout waiting for message. Got: ${messages.map((m) => m.type).join(", ")}`);
};

async function run() {
  console.log("API:", API);

  const lobby = await api("/api/lobby", {
    method: "POST",
    body: JSON.stringify({ hostName: "YOU" }),
  });
  console.log("✓ Created lobby", lobby.roomCode, lobby.gameId);

  const gameId = lobby.gameId;
  const playerId = lobby.playerId;
  const sessionToken = lobby.sessionToken;

  await api(`/api/lobby/${gameId}/fill-bots`, { method: "POST" });
  console.log("✓ Filled bots");

  await api(`/api/lobby/${gameId}/ready-all`, { method: "POST" });
  console.log("✓ Ready all");

  const { client, messages } = await connectStomp(gameId);
  console.log("✓ WebSocket connected");

  const withAuth = (payload) => ({ ...payload, sessionToken });

  sendAction(client, withAuth({ gameId, playerId, action: "START_GAME" }));
  await waitFor(messages, (m) => m.type === "GAME_STARTED");
  console.log("✓ Game started (housing)");

  sendAction(client, withAuth({ gameId, playerId, action: "ENTER_GAME" }));
  await sleep(300);

  sendAction(client, withAuth({
    gameId,
    playerId,
    action: "SELECT_HOUSING",
    rentType: "PARENTS",
  }));

  await waitFor(
    messages,
    (m) => m.type === "GAME_STATE" && m.payload?.gameStage === "PLAYING",
    20000
  );
  console.log("✓ Housing complete, round 1 playing");

  await sleep(500);
  sendAction(client, withAuth({ gameId, playerId, action: "DISMISS_ROUND_START" }));

  sendAction(client, withAuth({
    gameId,
    playerId,
    action: "PAY_SURVIVAL",
    rentDiceRoll: 4,
  }));

  await waitFor(
    messages,
    (m) => m.type === "GAME_STATE" && m.payload?.phase === "LOAN",
    90000,
    "survival phase"
  );
  console.log("✓ Survival phase complete for all players");

  sendAction(client, withAuth({ gameId, playerId, action: "PAY_LOAN", loanAmount: 150000 }));

  await waitFor(
    messages,
    (m) => m.type === "GAME_STATE" && m.payload?.phase === "DICE",
    90000,
    "loan phase"
  );
  console.log("✓ Loan phase complete");

  sendAction(client, withAuth({ gameId, playerId, action: "ROLL_DICE", diceRoll: 4 }));

  await waitFor(
    messages,
    (m) => m.type === "GAME_STATE" && m.payload?.phase === "NETWORTH",
    90000,
    "dice phase"
  );
  console.log("✓ Dice phase complete, net worth resolving");

  await waitFor(
    messages,
    (m) => m.type === "GAME_STATE" && m.payload?.round === 2,
    15000
  );
  console.log("✓ Advanced to round 2");

  client.deactivate();
  console.log("\n✅ Integration test passed");
}

run().catch((err) => {
  console.error("\n❌ Integration test failed:", err.message);
  process.exit(1);
});
