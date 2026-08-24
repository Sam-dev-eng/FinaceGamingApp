# Finance Frenzy — Full Stack

React frontend + Spring Boot WebSocket backend. See [ARCHITECTURE.md](./ARCHITECTURE.md) for production layout and how to add features (e.g. bank borrowing).

## Quick start (two terminals)

### Terminal 1 — Backend
```bash
cd FinancialGamingBackend
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```
Runs on **http://localhost:8080** (WebSocket: `/ws`, REST: `/api`)

### Terminal 2 — Frontend
```bash
cd FinancialGaming
cp .env.example .env   # first time only
npm install
npm run dev
```
Runs on **http://localhost:5173** — proxies `/api` and `/ws` to the backend.

## Play

### Solo + bots (practice)
1. Open **http://localhost:5173**
2. **Host Game** → **Add Practice Opponents** → **I'm Ready** (or Ready All) → **Start Game**
3. Case study → game → summary

### Real multiplayer (3 humans)
1. **Host** creates a lobby — copy the room code or join link
2. **Friends** open the join link (or `/join?code=ABC-123`) and enter their names
3. Each player clicks **I'm Ready** — lobby updates live for everyone
4. **Host** starts — all clients navigate to the case study together via WebSocket

Sessions persist in `sessionStorage` (survives refresh; use rejoin API if needed).

## Verify
```bash
# Backend integration (REST + STOMP)
cd FinancialGaming && npm run integration

# Full 4-round API test
cd FinancialGaming && npm run full-game

# Full browser E2E (backend + frontend must be running)
cd FinancialGaming && npm run e2e
```

## Architecture (summary)

| Layer | Role |
|-------|------|
| **REST** | Lobby create/join/rejoin, game actions with `sessionToken` |
| **WebSocket** | Live broadcasts on `/topic/game/{gameId}` |
| **Action handlers** | One Spring bean per action — extensible for `BORROW_FROM_BANK` |
| **Server engine** | Authoritative rules in `FinancialGamingBackend/.../engine/` |
| **Frontend features** | `features/lobby`, `features/game`, `shared/session` |

Full details: [ARCHITECTURE.md](./ARCHITECTURE.md)

## Deploy (Vercel + Render)

### 1. Backend on Render

1. Push this repo to GitHub and create a **Web Service** on [Render](https://render.com).
2. Use the repo root; set **Root Directory** to `FinancialGamingBackend` (or apply `render.yaml` from the repo root).
3. **Build command:** `mvn clean package -DskipTests`
4. **Start command:** `java -jar target/finance-gaming-backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod`
5. **Health check path:** `/api/health`
6. Add environment variable:
   - `CORS_ALLOWED_ORIGINS` = your Vercel URL(s), comma-separated  
     Example: `https://finance-frenzy.vercel.app`  
     Add preview URLs too if you test PR deploys (each preview gets its own origin).
7. Copy the Render service URL (e.g. `https://finance-gaming-backend.onrender.com`).

**Note:** Render’s free tier sleeps after inactivity (~30–60s cold start). For live multiplayer, use a paid **Starter** instance.

Verify: `curl https://YOUR-BACKEND.onrender.com/api/health` → `{"status":"UP",...}`

### 2. Frontend on Vercel

1. Import the repo in [Vercel](https://vercel.com).
2. Set **Root Directory** to `FinancialGaming`.
3. **Framework preset:** Vite (build: `npm run build`, output: `dist`).
4. Add **Environment Variables** (Production):
   - `VITE_API_URL` = `https://YOUR-BACKEND.onrender.com`
   - `VITE_WS_URL` = `https://YOUR-BACKEND.onrender.com/ws`
5. Deploy. `vercel.json` handles SPA routing for `/lobby`, `/join`, `/game`, etc.

### 3. Smoke test

1. Open the Vercel URL → **Host Game** → copy room code.
2. Join from a second browser/incognito tab.
3. Ready both → **Start Game** → play through to summary.
4. Confirm finished rooms are removed from memory after ~2 minutes (backend log: `Removed game room ...`).

### Production config reference

| Where | Variable | Purpose |
|-------|----------|---------|
| Render | `CORS_ALLOWED_ORIGINS` | Allowed browser origins (Vercel URL) |
| Render | `PORT` | Set automatically by Render |
| Render | `SPRING_PROFILES_ACTIVE=prod` | Production logging profile |
| Vercel | `VITE_API_URL` | Backend REST base URL |
| Vercel | `VITE_WS_URL` | Backend SockJS endpoint |
