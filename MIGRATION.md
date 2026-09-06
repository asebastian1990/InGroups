# InGroups Production Migration Plan

**Stack:** Neon (Postgres) + Clerk (Auth) + Railway (API + game server) + **Cloudflare Pages** (client)

This document is the consolidated roadmap from local dev to production, with Microsoft Teams and Google Meet added later. **You** handle signups and credentials outside Cursor; **the agent** handles code integration when you paste keys/URLs and ask to hook things up.

You already use Cloudflare for DNS and Workers — the client will live on **Cloudflare Pages** attached to your existing domain.

---

## Architecture overview

```
┌─────────────────┐     REST/tRPC      ┌──────────────┐
│  React app      │ ─────────────────► │  API server  │──► Neon Postgres
│ (Cloudflare     │                    │  (Railway)   │     users, subscriptions,
│  Pages)         │                    └──────────────┘     custom_word_sets
└─────────────────┘
       │
       │ WebSocket
       ▼
┌─────────────┐     (optional)     ┌──────────────┐
│ Game server │ ◄────────────────► │ Upstash Redis│  ← Phase 5+, multi-node only
│ (Railway)   │                    └──────────────┘
└─────────────┘
  rooms, rounds, chat — in memory only
```

| Concern | Where it lives | Why |
|---|---|---|
| Active lobbies, rounds, guesses, chat | Game server (memory ± Redis) | Sub-second updates, ephemeral |
| Users, subscriptions, custom word sets | Neon Postgres via API | Durable, queryable |
| Sign-in (email, Google, Apple) | Clerk | JWT issued to client + servers |
| Static client (React/Vite) | Cloudflare Pages | Same Cloudflare account as your domain |

**The database + API are NOT the live source of truth during gameplay.** They gate access to content and persist account data. The game server owns room state while people are playing.

---

## Provider free tiers (testing)

| Role | Provider | Free tier (approx.) |
|---|---|---|
| Database | [Neon](https://neon.tech) | 0.5 GB storage, no credit card required |
| Auth | [Clerk](https://clerk.com) | 10,000 MAU/month |
| API + game server | [Railway](https://railway.app) | Trial credit, then pay-as-you-go |
| Client | [Cloudflare Pages](https://pages.cloudflare.com) | Unlimited static requests; 500 builds/month |
| DNS / domain | Cloudflare (existing) | Already in use |
| Redis (later) | [Upstash](https://upstash.com) | 10k commands/day — only when scaling game servers |

---

## What moves off local dev

| Today | After migration |
|---|---|
| In-memory rooms (`socket.ts`) | Game server on Railway — still in memory |
| SQLite (`ingroups.db`) licenses + word sets | Neon Postgres |
| `clientId` in localStorage | Clerk session + JWT |
| Word sets / license over socket | REST API on Railway |
| `createRoom`, rounds, chat over socket | Unchanged — game server only |
| Local Vite dev server | Cloudflare Pages (production client) |

---

## Master checklist

```
□ Phase 1 — Database (Neon)
  ✓ Sign up at neon.tech → create project (e.g. ingroups-dev)
  ✓ Copy DATABASE_URL connection string
  ✓ Agent hooked up Drizzle + pg (see server/src/db/)
  □ Optional: rotate DB password if it was shared in chat

□ Phase 2 — Auth (Clerk)
  ✓ Sign up at clerk.com → create application "InGroups"
  ✓ Enable: Email, Google
  ✓ Copy Publishable key (pk_…) and Secret key (sk_…)
  □ Add redirect URLs in Clerk dashboard:
      http://localhost:5173
      https://<your-cloudflare-pages-domain>
  ✓ Agent hooked up Clerk (client sign-in + server JWT validation)

□ Phase 3 — Split API from game server + deploy
  □ Push repo to GitHub (ask agent if needed)
  □ Railway: deploy ingroups-api + ingroups-game, set env vars
  □ Cloudflare Pages: connect repo, configure build (see below), set env vars
  □ Attach custom domain in Pages → your existing Cloudflare zone
  □ Tell agent: "Split API and game server" + paste URLs

□ Phase 4 — Subscriptions (Stripe, when ready)
  □ Stripe test mode → Product + Price → copy keys
  □ Tell agent: "Hook up Stripe subscriptions"

□ Phase 5 — Production hardening
  □ DNS: app on Cloudflare Pages (same zone); api/game CNAMEs → Railway
  □ CORS on API/game servers: allow your Pages domain
  □ Tell agent: "Set up staging environment"
  □ Upstash Redis when running multiple game-server instances

□ Phase 6 — Microsoft Teams (later)
  □ M365 Developer Program → Azure Entra app registration
  □ Tell agent: "Build Teams tab integration" + Azure app IDs

□ Phase 7 — Google Meet (later)
  □ Google Cloud project + OAuth consent
  □ Tell agent: "Build Meet companion integration"
```

---

## Phase 1 — Database (Neon)

### You do

1. Sign up at [neon.tech](https://neon.tech).
2. Create a project (e.g. `ingroups-dev`).
3. Copy the **connection string** (`postgresql://…?sslmode=require`).
4. Optional: confirm the empty DB in Neon SQL editor.

### Agent does (when you ask: **"Hook up Neon"**)

- Add Drizzle ORM + `pg` driver (standard Postgres connection via `DATABASE_URL`).
- Schema: `licenses`, `license_attempts`, `custom_word_sets`, plus `users` / `subscriptions` (ready for Clerk/Stripe).
- Migrate persistent data off SQLite; game rooms stay in memory.
- **Skip** Neon's CLI onboarding (`neon login`, `neon deploy`, `neon.ts`, MCP/skills) — that workflow is for Neon's serverless platform, not this Express app.

**Local commands after hookup:**

```bash
npm run db:push    # apply schema changes to Neon
npm run dev        # starts client + server (reads .env)
```

`.env` at project root (gitignored):

```
DATABASE_URL=postgresql://...
```

### You provide

```
DATABASE_URL=postgresql://...
```

---

## Phase 2 — Authentication (Clerk)

### You do

1. Sign up at [clerk.com](https://clerk.com) → application **InGroups**.
2. Enable sign-in: **Email**, **Google** (Apple when ready for iOS).
3. **API Keys:** copy Publishable + Secret keys.
4. **Paths → Redirect URLs:**
   - `http://localhost:5173`
   - `https://<your-project>.pages.dev` (Cloudflare Pages default URL)
   - `https://ingroups.yourdomain.com` (or whatever subdomain you use)

### Agent does (when you ask: **"Hook up Clerk"**)

- Clerk React SDK (sign-in / sign-up / user button).
- Replace `clientId` with Clerk JWT.
- Validate JWT on API routes and WebSocket connect.
- Map Clerk `userId` → `users` row in Neon on first login.
- Subscription checks use `userId`, not anonymous `clientId`.

### You provide

```
CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

---

## Phase 3 — API split, deploy, env vars

### You do

**GitHub**

- Push repo (agent can help with `new-repo` / share skill if needed).

**Railway** — two services from same repo:

| Service | Purpose | Env vars |
|---|---|---|
| `ingroups-api` | REST: word sets, profile, subscriptions | `DATABASE_URL`, `CLERK_SECRET_KEY`, `PORT=3001`, `CORS_ORIGIN=https://ingroups.yourdomain.com` |
| `ingroups-game` | Socket.io: rooms, rounds, chat | `CLERK_SECRET_KEY`, `PORT=3002`, `API_URL=https://api.yourdomain.com`, `CORS_ORIGIN=…` |

**Cloudflare Pages** — connect GitHub repo:

| Setting | Value |
|---|---|
| Production branch | `main` |
| Root directory | `client` |
| Build command | `npm ci && npm run build` |
| Build output directory | `dist` |
| Node.js version | 20 (or latest LTS in Pages settings) |

**Environment variables** (Pages → Settings → Environment variables):

```
VITE_CLERK_PUBLISHABLE_KEY=pk_...
VITE_API_URL=https://api.yourdomain.com
VITE_GAME_URL=https://game.yourdomain.com
```

Set these for **Production** and **Preview** (Preview can point at staging API URLs later).

**Custom domain** (Pages → Custom domains):

1. Add e.g. `ingroups.yourdomain.com` or `play.yourdomain.com`.
2. Cloudflare auto-configures DNS in your existing zone — no extra registrar steps.

**SPA routing:** Vite/React client-side routes need a fallback to `index.html`. Agent will add a `client/public/_redirects` file (`/* /index.html 200`) or equivalent when wiring deploy.

### Agent does (when you ask: **"Split API and game server"**)

- REST routes:
  - `GET /me` — profile + subscription status
  - `GET /word-sets` — subscription-gated
  - `POST /word-sets`, `DELETE /word-sets/:id`
- Socket handlers: gameplay only (`createRoom`, `joinRoom`, rounds, chat, groups).
- Client: API for content, socket for play.
- CORS + Clerk middleware on API (allow your Cloudflare Pages origin).
- SPA `_redirects` for Cloudflare Pages if not already present.

### Socket vs API boundary

| Stays on game server (WebSocket) | Moves to API (REST) |
|---|---|
| createRoom, joinRoom, rejoinRoom | getWordSets |
| startRound, endRound, guesses | saveWordSet, deleteWordSet |
| shuffleGroups, shiftGroups | getLicense / subscription status |
| chat, room broadcasts | Stripe checkout + webhooks (Phase 4) |

### Suggested DNS layout (Cloudflare zone)

| Hostname | Points to |
|---|---|
| `ingroups.yourdomain.com` | Cloudflare Pages (client) |
| `api.yourdomain.com` | Railway (`ingroups-api`) via CNAME |
| `game.yourdomain.com` | Railway (`ingroups-game`) via CNAME |

All three can live in the same Cloudflare account you already use for Workers.

---

## Phase 4 — Subscriptions (Stripe)

### You do

1. [stripe.com](https://stripe.com) → **Test mode**.
2. Create Product + recurring Price (e.g. InGroups Premium).
3. Copy `STRIPE_SECRET_KEY`, webhook signing secret.
4. Stripe webhook URL → `https://api.yourdomain.com/webhooks/stripe`.

### Agent does (when you ask: **"Hook up Stripe subscriptions"**)

- Checkout session + Customer Portal endpoints.
- Webhook → update `subscriptions` in Neon.
- Gate premium word sets + custom word set creation on `subscription.status === 'active'`.
- Optional: keep license keys as fallback during transition.

---

## Phase 5 — Production hardening

| Step | Who | Action |
|---|---|---|
| Custom domain | You | Client: Pages custom domain in existing zone. API/game: CNAMEs → Railway |
| HTTPS | Automatic | Cloudflare Pages + Railway both terminate TLS |
| CORS | Agent | API + game server allow `https://ingroups.yourdomain.com` |
| Preview deploys | You | Pages preview branches for PRs; optional staging API on Railway |
| Staging | Both | Neon branch/project + Railway staging services + Pages preview env vars |
| Multi-instance game servers | Agent + You | Upstash Redis for room registry + pub/sub |
| Room TTL / cleanup | Agent | Already mostly implemented; tune for prod |
| Cloudflare Workers (optional) | You / later | Could proxy or cache API at the edge — not required for v1 |

---

## Phase 6 — Microsoft Teams (after core is live)

Neither Neon nor Clerk replaces this — **Azure app registration is always required**.

### You do

1. [Microsoft 365 Developer Program](https://developer.microsoft.com/microsoft-365/dev-program) — free sandbox tenant.
2. **Azure Entra ID** → register app → Teams Tab capability.
3. Configure SSO for Teams context.
4. Teams tab **content URL** → `https://ingroups.yourdomain.com/teams` (Cloudflare Pages).

### Agent does (when you ask: **"Build Teams tab integration"**)

- Teams Tab → hosted React route (e.g. `/teams`) on Cloudflare Pages.
- `@microsoft/teams-js` — meeting context, theme.
- Optional: bot to post room codes in meeting chat.
- Map Azure SSO token → same `users` row in Neon (link to Clerk account).

### Why Clerk helps here (slightly)

- **Sign in with Microsoft** outside Teams.
- **Organizations** for org-level subscriptions.
- **Enterprise SSO (SAML/OIDC)** on paid Clerk plans.

Teams Tab embedding still uses Azure the same way regardless of DB choice.

---

## Phase 7 — Google Meet (after Teams or in parallel)

Meet add-ons are more constrained than Teams tabs. Practical v1: **companion web app** + deep link from Calendar/Meet.

### You do

1. [Google Cloud Console](https://console.cloud.google.com) → new project.
2. OAuth consent screen; enable APIs as needed for add-on/companion pattern.
3. Clerk Google provider already covers consumer sign-in; Meet may need extra Workspace scopes.

### Agent does (when you ask: **"Build Meet companion integration"**)

- Companion route + launch context from Meet/Calendar where supported.
- Same game engine; entry adapter only.
- Hosted on same Cloudflare Pages app (e.g. `/meet`).

**Note:** Clerk vs Neon does not materially change Meet integration effort.

---

## Suggested “ask agent” prompts (in order)

1. `Hook up Neon — here's my DATABASE_URL: …`
2. `Hook up Clerk — here are my keys: …`
3. `Split the API from the game server and move word sets + licenses to Postgres`
4. `Deploy config — here are my Railway URLs and Cloudflare Pages domain: …`
5. *(Later)* `Hook up Stripe test mode — here are my keys: …`
6. *(Later)* `Set up staging environment`
7. *(Later)* `Build Teams tab integration — here's my Azure app ID: …`
8. *(Later)* `Build Meet companion integration`

Each prompt is a self-contained coding session. **Phase 1 (Neon alone) is enough to start.**

---

## Postgres schema (target)

```sql
users              -- id, clerk_user_id, email, display_name, created_at
subscriptions      -- user_id, plan, status, stripe_subscription_id, expires_at
custom_word_sets   -- id, owner_user_id, name, words, created_at
licenses           -- optional bridge from current license-key system → accounts
```

Active lobbies are **not** stored here. Optional lightweight `rooms` rows for analytics only.

---

## Neon + Clerk vs Supabase (decision record)

We chose **Neon + Clerk** because:

- Clerk: better auth UX, Organizations, enterprise SSO path for Teams/B2B later.
- Neon: Postgres without Supabase free-tier project pausing during quiet weeks.
- Meet/Teams integration effort is **the same** either way; Clerk helps slightly on enterprise SSO, not on platform embedding.

Do **not** use Supabase Auth alongside Clerk — one auth source only.

**Client hosting:** Cloudflare Pages (not Vercel) — same account as existing domain and Workers.

---

## Current local dev (unchanged until Phase 1+)

```bash
npm run dev   # client ~5173, server ~3001
```

SQLite + in-memory rooms remain until you complete Phase 1–3 and ask the agent to migrate.
