# Deploy InGroups (Phase 3)

Single-server deploy first: **Railway** hosts the Node game server; **Cloudflare Pages** hosts the React client. API/game split comes later.

---

## Part A — Railway (game server)

### 1. Create project

1. Open [railway.app/new](https://railway.app/new)
2. **Deploy from GitHub repo** → choose `asebastian1990/InGroups`
3. When asked for a service, add one service from the repo

### 2. Set root directory

The server imports code from the repo-level `shared/` folder, so Railway must deploy the **whole repo**, not just `server/`:

1. Click the service → **Settings**
2. **Root Directory** → leave **empty** (or `/`)
3. Save

Railway will install server dependencies and run `npm start` (see root `railway.toml`).

### 3. Environment variables

Service → **Variables** → add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Neon connection string (same as local `.env`) |
| `CLERK_SECRET_KEY` | From Clerk dashboard |
| `CORS_ORIGIN` | Your Cloudflare Pages URL (see Part B step 4). Comma-separate preview + custom domain later, e.g. `https://ingroups.pages.dev,https://play.yourdomain.com` |

Railway sets `PORT` automatically — do not override it.

### 4. Public URL

1. Service → **Settings** → **Networking** → **Generate Domain**
2. Copy the URL, e.g. `https://ingroups-production.up.railway.app`
3. Test: open `https://YOUR-RAILWAY-URL/api/health` — should return `{"ok":true,"database":"neon"}`

Keep this URL for Part B (`VITE_SERVER_URL`).

---

## Part B — Cloudflare Pages (client)

### 1. Create Pages project

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. Select GitHub → repo `InGroups`
3. Build settings:

| Setting | Value |
|---|---|
| Production branch | `main` |
| Root directory | `client` |
| Build command | `npm ci && npm run build` |
| Build output directory | `dist` |

### 2. Environment variables (Build)

**Settings → Environment variables** — add for **Production** (and **Preview** when testing):

| Variable | Value |
|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (`pk_test_...` or live key) |
| `VITE_SERVER_URL` | Railway URL from Part A step 4 (no trailing slash) |
| `VITE_CLERK_SIGN_IN_URL` | Your Pages URL with trailing slash, e.g. `https://ingroups.pages.dev/` |
| `VITE_CLERK_SIGN_UP_URL` | Same as sign-in URL for this app |
| `VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | Same Pages URL (used when OAuth is cancelled) |
| `VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | Same Pages URL |

Redeploy after changing these (they are baked in at build time).

### 3. Deploy

Save and deploy. Note the Pages URL, e.g. `https://ingroups.pages.dev`.

### 4. Finish CORS + Clerk

**Railway:** update `CORS_ORIGIN` to your Pages URL (and custom domain when you add one).

**Clerk → Configure → Paths:** add your Pages URL to allowed origins / fallback dev host.

**Clerk → Configure → Account Portal → Redirects:** set fallback URLs so a cancelled OAuth does not strand users on `*.accounts.dev`:
- Sign-in fallback: `https://ingroups.pages.dev/` (your Pages URL)
- Sign-up fallback: same URL

### 5. Custom domain (optional)

Pages → **Custom domains** → add e.g. `play.yourdomain.com`. DNS is handled in Cloudflare if the zone is on your account.

Update `CORS_ORIGIN` and Clerk redirect URLs to include the custom domain.

---

## Verify end-to-end

1. Open your Pages URL
2. Sign in with Clerk (Google or email)
3. Host a game — room creation hits Railway over Socket.io
4. Open a second browser/incognito and join with the room code

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| OAuth lands on `*.accounts.dev` | Set Account Portal fallback redirects + Cloudflare `VITE_CLERK_SIGN_IN_URL` to your Pages URL; redeploy |
| Blank page after sign-in | Browser console errors; confirm `VITE_SERVER_URL` was set before last Pages build |
| Socket connection failed | Railway service running? `CORS_ORIGIN` includes exact Pages URL (https, no trailing slash) |
| Unauthorized on socket | `CLERK_SECRET_KEY` on Railway matches the Clerk app used by the client publishable key |
| Health check fails | `DATABASE_URL` correct; Neon project not paused |

---

## After first deploy

- Push deploy config changes to GitHub so Railway/Pages stay in sync
- Later: split REST API vs game server (`MIGRATION.md` Phase 3 “Split API and game server”)
- Phase 4: Stripe subscriptions
