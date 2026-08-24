# Finance Gaming Backend

Spring Boot backend for **Finance Frenzy** with REST lobby APIs and STOMP WebSockets (SockJS), matching the React frontend contract in `FinancialGaming/src/services/Websocket.js`.

## Requirements

- Java 21+
- Maven 3.8+

## Run

```bash
cd FinancialGamingBackend
mvn spring-boot:run
```

Server starts on **http://localhost:8080**

- WebSocket (SockJS): `http://localhost:8080/ws`
- REST API: `http://localhost:8080/api/lobby`

## REST API

### Create lobby (host)

```http
POST /api/lobby
Content-Type: application/json

{ "hostName": "YOU" }
```

Response includes `gameId`, `roomCode`, and `players`.

### Join lobby

```http
POST /api/lobby/join
Content-Type: application/json

{ "roomCode": "ABC-123", "playerName": "Opponent A" }
```

### Get lobby state

```http
GET /api/lobby/{gameId}
GET /api/lobby/room/{roomCode}
```

## WebSocket (STOMP)

Connect with SockJS + STOMP (same as the frontend):

- **Endpoint:** `/ws`
- **Subscribe:** `/topic/game/{gameId}`
- **Send actions:** `/app/game.action`

### Action payload

```json
{
  "gameId": "uuid",
  "playerId": "player-1",
  "action": "SET_READY"
}
```

Supported actions:

| Action | Extra fields |
|--------|----------------|
| `SET_READY` | — |
| `START_GAME` | host only, all 3 players ready |
| `SELECT_HOUSING` | `rentType`: `PARENTS`, `SHARED`, `SINGLE`, `LUXURY` |
| `PAY_SURVIVAL` | `rentDiceRoll` (required for `PARENTS`) |
| `PAY_LOAN` | `loanAmount` |
| `ROLL_DICE` | optional `diceRoll` (1–6) |
| `DISMISS_ROUND_START` | — |

### Broadcast message types

| Type | Description |
|------|-------------|
| `LOBBY_UPDATED` | Player joined / ready status |
| `GAME_STARTED` | Housing setup began |
| `GAME_STATE` | Full authoritative game state |
| `GAME_ENDED` / `FINAL_RESULTS` | End-of-game payload for summary screen |
| `ERROR` | Action failed |

## Game rules (server-side)

The backend implements the same rules as the frontend:

- 3 players, 4 rounds
- Pre-game housing (once)
- Phases: Survival → Loan → Dice → Net Worth
- Parent/Guardian rent: dice roll × 2% inflation per pip
- 10% loan interest each round
- Turn auto-play after configurable timeout (default 10s)

## Configuration

`src/main/resources/application.yml`:

```yaml
finance-gaming:
  turn-timeout-seconds: 10
  round-start-duration-ms: 60000
  net-worth-phase-duration-ms: 5000
  dice-result-delay-ms: 4000
  cors-allowed-origins:
    - http://localhost:5173
```

## Frontend integration

The frontend already expects:

```js
SockJS("http://localhost:8080/ws")
stompClient.subscribe(`/topic/game/${gameId}`, ...)
stompClient.publish({ destination: "/app/game.action", body: JSON.stringify(action) })
```

Wire lobby creation/join to the REST API, then connect WebSocket with the returned `gameId` and send actions using your assigned `playerId`.

## Production (Render via Docker)

Render has no native Java runtime — deploy using the included **Dockerfile**.

| Setting | Value |
|---------|--------|
| Language | **Docker** |
| Dockerfile Path | `FinancialGamingBackend/Dockerfile` |
| Docker Context | `FinancialGamingBackend` |
| Health check | `/api/health` |

Environment variables:

| Key | Value |
|-----|--------|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `CORS_ALLOWED_ORIGINS` | Vercel URL(s), comma-separated |

See root [README.md](../README.md#deploy-vercel--render) for full deploy steps.

## Notes

- Game state is stored **in memory** (single instance; finished games are purged after ~2 minutes).
- For scale beyond a demo, add Redis pub/sub and persistent storage.
