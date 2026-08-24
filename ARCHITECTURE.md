# Finance Frenzy — Architecture

Production-oriented layout for real-time multiplayer and extensible game rules.

## High-level flow

```
Browser (React)                    Spring Boot
─────────────────                  ───────────
features/lobby  ──REST──►  LobbyController  ──► GameService (lobby)
     │                              │
     └── WebSocket subscribe ◄──────┼── GameBroadcaster (/topic/game/{id})
features/game   ──REST──►  GameController   ──► ActionDispatcher
     │                              │              └── handlers/* → GameCommandPort
     └── state from WS ◄────────────┘
```

- **Server is authoritative** — all rules, turns, timers, and money live in Java `engine/`.
- **REST** submits actions (with `sessionToken`); **WebSocket** pushes state to every client in the room.
- **Humans** join with a room code; **bots** are optional practice fillers (`bot: true` on `PlayerState`).

## Backend packages

| Package | Purpose |
|---------|---------|
| `action/` | `GameAction` enum, `ActionDispatcher`, handler interface |
| `application/handlers/` | One Spring bean per action (add `BorrowFromBankHandler` when ready) |
| `application/GameCommandPort` | Interface implemented by `GameService` |
| `domain/` | `GameSession`, `PlayerState`, `PlayerStates` factory |
| `engine/` | Pure rules (`PlayerLogic`, `RentCalculator`) |
| `infrastructure/` | `PlayerSessionStore` (tokens; swap for Redis/JWT in prod) |
| `service/` | `GameService`, `GameBroadcaster`, `GameSchedulerService` |
| `repository/` | `GameRepository` (in-memory; swap for Redis/Postgres) |

### Adding bank borrowing (example)

1. Add `bankDebt` (or similar) to `PlayerState`.
2. Implement `PlayerLogic.applyBankBorrow(...)`.
3. Replace `GameCommandPort.borrowFromBank` default with real logic in `GameService`.
4. `BorrowFromBankHandler` already routes `BORROW_FROM_BANK` actions.
5. Frontend: add UI in `features/game/components/EventArea.jsx` + `useServerGame.borrowFromBank()`.

## Frontend packages

| Path | Purpose |
|------|---------|
| `features/lobby/` | Room code, join, ready, start (real-time via WS) |
| `features/game/` | Game screen, phases, server hook |
| `features/summary/` | Final results |
| `shared/api/` | REST + WebSocket + state adapter |
| `shared/session/` | `sessionStorage` for `gameId`, `playerId`, `sessionToken` |
| `shared/game-display/` | Formatting only — no rule duplication |
| `game/gameConstants.js` | Labels and display constants (not source of truth for rules) |

Legacy paths (`src/hooks/`, `src/pages/`) re-export from features during migration.

## Multiplayer checklist

- [x] Room codes generated server-side
- [x] WebSocket lobby/game broadcasts
- [x] Session tokens per player
- [x] Rejoin endpoint (`POST /api/lobby/{gameId}/rejoin`)
- [x] Explicit `bot` flag on players
- [ ] Redis pub/sub for horizontal scale
- [ ] Server-only dice RNG (client sends intent only)
- [ ] Per-player ready (host ready-all is dev convenience)

### Real-time lobby (how it works)

1. Host creates lobby → client subscribes to `/topic/game/{gameId}`
2. Friend joins via REST → server broadcasts `LOBBY_UPDATED` → **all open tabs update instantly**
3. Player clicks **I'm Ready** → server broadcasts again → everyone sees it live
4. If a tab was in the background, one REST sync runs when you focus the tab (browsers may pause WS)
5. **You never refresh the page** — deployed or local, WebSocket is the primary channel

## Running

See root [README.md](../README.md).

## Tests

```bash
cd FinancialGaming && npm run integration && npm run e2e
```
