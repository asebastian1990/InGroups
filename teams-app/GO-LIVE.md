# InGroups — Teams Store go-live checklist

Internal roadmap from **dev/sideload** → **production** → **Microsoft Teams Store** (external orgs).

**Current dev state (Mar 2026):** Cloudflare Pages (`ingroups.pages.dev`), Railway trial, Stripe test mode, Clerk, Neon, Azure SSO on LLC tenant, org catalog + meeting upload tested with `tester1`.

**End-state model (Kahoot-like):** You publish once to the Teams Store. Each customer’s IT admin allows/installs InGroups in **their** tenant. Players use **their** work accounts — you do **not** need licenses on your LLC tenant for external users.

---

## Phase 1 — Production infrastructure

Railway free/trial is not suitable for Store review or real customers (sleep, limits, URL changes).

- [ ] **Railway:** Upgrade to paid plan; disable sleep on production service
- [ ] **Custom domain for API** (recommended): e.g. `api.ingroups.com` → Railway (update `CORS_ORIGIN`, client `VITE_SERVER_URL`)
- [ ] **Custom domain for web:** `ingroups.annaliese-sebastian.com` → Cloudflare Pages — see **[PRE-LAUNCH.md](./PRE-LAUNCH.md)**
- [ ] **Neon:** Confirm production branch, backups, connection limits for expected load
- [ ] **Environment variables** on Railway (production values, no test keys):
  - `CLERK_SECRET_KEY`, `DATABASE_URL`, `CORS_ORIGIN`, `APP_URL`
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (live)
  - `TEAMS_AAD_CLIENT_ID`, `TEAMS_AAD_APP_URI` (see Phase 3)
- [ ] **Health check:** `/api/health` returns `ok`, `teamsSso: true`, `stripe: true`
- [ ] **Remove test domains** from Teams manifest `validDomains` before Store submit (Microsoft rejects non-production domains)

---

## Phase 2 — Stripe (test → live)

- [ ] Complete Stripe account activation (business details, bank account)
- [ ] Switch Dashboard to **Live mode**
- [ ] Create live **webhook** → `https://YOUR-API/api/stripe/webhook` (events: `checkout.session.completed`, `checkout.session.expired`)
- [ ] Put **live** `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` on Railway
- [ ] Test one real small purchase on web + Teams browser checkout flow
- [ ] Confirm license fulfillment (webhook + `/api/licenses/confirm` fallback)

---

## Phase 3 — Clerk (production auth)

See **[PRE-LAUNCH.md](./PRE-LAUNCH.md) Step 4** (Production instance, Domains, Google OAuth, live keys).

- [ ] Teams SSO: Azure app stays **multitenant** (already set); `TEAMS_AAD_APP_URI` must use **production** Pages host + client ID
- [ ] Re-package Teams manifest with production URLs + Azure client ID

---

## Phase 4 — Legal, support, and manifest polish

See also [PRE-LAUNCH.md](./PRE-LAUNCH.md).

- [ ] **Privacy policy** page (public URL, linked in manifest + Partner Center)
- [ ] **Terms of use** page
- [ ] **Support contact** — email or support URL (required for Store; put in Partner Center listing)
- [ ] **Short + full description** — Store-ready copy (features, players, licenses, meetings)
- [ ] **Icons** — `color.png` (192×192), `outline.png` (32×32 white on transparent); must match Partner Center upload
- [ ] **Screenshots** for Store listing (desktop Teams tab, meeting side panel, gameplay)
- [ ] **Optional demo video** — speeds Microsoft validation

Update `manifest.template.json` → bump version → `npm run teams:package`.

---

## Phase 5 — Microsoft Partner Center

Required to publish to Teams Store (not the same as Teams Admin Center org upload).

- [ ] Create / verify [Partner Center](https://partner.microsoft.com) developer account (LLC legal entity)
- [ ] Complete **Publisher verification** (email, employment, business — can take days)
- [ ] **Publisher attestation** (annual, for Teams apps)

Docs: [Create Partner Center account](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/appsource/prepare/create-partner-center-dev-account)

---

## Phase 6 — Teams Store submission

- [ ] Validate package in [Teams Developer Portal](https://dev.teams.microsoft.com) (manifest errors)
- [ ] Read [Teams Store validation guidelines](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/appsource/prepare/teams-store-validation-guidelines) and [submission checklist](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/appsource/prepare/submission-checklist)
- [ ] Partner Center → **New offer** → Teams app → upload `.zip`
- [ ] Listing metadata must **match manifest exactly** (name, developer, privacy, terms, icons, description)
- [ ] **Test accounts** for Microsoft validation team:
  - Admin + non-admin (e.g. `tester1`-style accounts in a test tenant, or sign-up instructions if self-serve)
  - One account with **active license** (premium word sets)
  - **Test notes:** step-by-step — open tab, SSO, host game, join with room code, purchase license, meeting side panel
- [ ] Test on **Teams desktop + web** (mobile if you claim support)
- [ ] Submit; respond to `subm@microsoft.com` / validation thread until approved (often 1–3+ weeks, resubmits common)

Docs: [Publish to Teams Store](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/appsource/publish)

---

## Phase 7 — After approval (external users)

- [ ] App appears in Teams Store / “Built for your org” when admins allow it
- [ ] Each customer org: their admin may need to **allow** the app (permission / setup policy) — normal for enterprise
- [ ] Monitor Railway, Neon, Stripe, Clerk dashboards
- [ ] Plan incident/support channel for license and SSO issues across tenants

---

## What you can defer

| Item | Notes |
|------|--------|
| Custom domain | In progress: `ingroups.annaliese-sebastian.com` — see [PRE-LAUNCH.md](./PRE-LAUNCH.md) (Cloudflare may take up to 48h) |
| Meeting “Upload an app” workaround | Store customers use normal app install; meeting static tab (v1.0.2+) + org policies handle most cases |
| Zoom integration | Separate track ([INTEGRATIONS-SETUP.md](../INTEGRATIONS-SETUP.md) Part B) |
| M365 trial extra users | Only for your testing; not required for external customers |

---

## Suggested order (minimal path)

1. Railway paid + Stripe live + Clerk production URLs  
2. Privacy / terms / support pages  
3. Partner Center account + publisher verification (start early — slow)  
4. Production manifest package + Developer Portal validation  
5. Store submission with test accounts + notes  
6. Custom subdomain — [PRE-LAUNCH.md](./PRE-LAUNCH.md) (can run in parallel with Partner Center verification)

---

## Rough ongoing costs (ballpark)

| Service | Dev now | Go-live |
|---------|---------|---------|
| Railway | Trial credits | ~$5–20+/mo (24/7 API + sockets) |
| Cloudflare Pages | Free | Free (custom domain ~$10/yr if you buy one) |
| Neon | Free tier | Scales with usage |
| Clerk | Free tier limits | Paid at MAU threshold |
| Stripe | Test | Per-transaction fees only |
| M365 / Azure | Trial | Azure app registration free; no per-user cost for Store customers on their own tenants |
