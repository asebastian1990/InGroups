# Platform integration setup (Teams + Zoom)

Pinned checklist for David. Resume when tenant admin settings propagate or when ready to build.

**Tenant admin:** `DavidHau@AnnalieseSebastianLLC.onmicrosoft.com`  
**Azure portal:** [portal.azure.com](https://portal.azure.com) (same work account)

**To resume with the agent:** say *"Continue from INTEGRATIONS-SETUP.md — Teams sideload v0"* (or Zoom section).

---

## Already done

- [x] Microsoft 365 Business Basic trial (Annaliese Sebastian LLC)
- [x] Work account created (`@AnnalieseSebastianLLC.onmicrosoft.com`)
- [x] Signed into Azure portal with work account
- [x] Teams admin: custom app upload enabled
- [x] InGroups `/teams` route + manifest template (deploy + package zip still required)
- [ ] Zoom Marketplace app (not started)

---

## Part A — Microsoft Teams (PAUSED)

### A1. Tenant admin (you — when settings are available)

1. Sign in: [admin.teams.microsoft.com](https://admin.teams.microsoft.com)
2. **Teams apps → Setup policies → Global**
   - Turn **Upload custom apps** → **On** → Save
3. **Teams apps → Manage apps → Actions → Org-wide app settings → Custom apps**
   - Allow users to install/use custom apps → Save
4. Wait up to **24 hours** for policy to apply.

**Verify:** Teams client → **Apps → Manage your apps** → you should see **Upload an app** / **Upload a custom app**.

### A2. Confirm production URLs (you)

| Item | URL | Status |
|------|-----|--------|
| Client (Cloudflare Pages) | `https://_______________` | |
| Server (Railway) | `https://_______________` | |
| End-to-end browser test | Host + join via room code | [ ] |

Fill in URLs from Cloudflare Pages + Railway. Game must work in a normal browser before Teams.

### A3. Billing reminder (you)

- Trial auto-renews **~2026-10-16** unless cancelled or license count adjusted.
- Before then: [admin.microsoft.com](https://admin.microsoft.com) → **Billing → Your products**
  - Cancel recurring billing **or** set paid license count to **1** (or what you need).
- Test users: add in **Users → Active users** (trial allows up to **25** licensed users).

### A4. Code + deploy

Code (done locally — **push + redeploy Cloudflare Pages**):

- [x] `/teams` route (React + `@microsoft/teams-js`, `app.initialize()`)
- [x] `/teams/config` for channel/meeting tab setup
- [x] Cloudflare `_headers` (`frame-ancestors` for Teams domains)
- [x] `teams-app/manifest.template.json` + icons + `npm run teams:package`
- [x] Guest play in Teams iframe (no Clerk sign-in redirect; license/shop hidden in Teams v0)

You still need:

- [ ] Push to `main` and confirm Cloudflare Pages deploy succeeded
- [ ] Open `https://YOUR-PAGES-URL/teams` in browser (loads landing as guest)

### A5. Package and sideload (you — after A1 + A4)

1. Zip **at root** (not inside a folder):
   - `manifest.json`
   - `color.png` (192×192)
   - `outline.png` (32×32)
2. Teams (Mac app or [teams.microsoft.com](https://teams.microsoft.com)) → **Apps → Manage your apps → Upload a custom app**
3. Test **Personal** scope first, then a **meeting side panel**.

### A6. Multi-user Teams testing (you)

- Create `tester1@AnnalieseSebastianLLC.onmicrosoft.com`, etc. in M365 admin
- Assign licenses from trial pool
- Same meeting: each user opens InGroups side panel (or use multiple browser profiles yourself)

### A7. Teams SSO + shop (code done — you configure Azure + redeploy)

**Why it still feels like “just the app”:** v0 sideload runs in guest mode until Azure SSO is wired. The tab is an iframe by design; SSO adds automatic Clerk sign-in from your Teams account.

**Detailed steps:** [teams-app/AZURE-SSO-SETUP.md](./teams-app/AZURE-SSO-SETUP.md)

**You (Azure + deploy):**

- [ ] Azure app registration + Expose an API (`access_as_user`) — see AZURE-SSO-SETUP.md
- [ ] Railway env: `TEAMS_AAD_CLIENT_ID`, `TEAMS_AAD_APP_URI` → redeploy
- [ ] Deploy latest client to Cloudflare Pages
- [ ] `npm run teams:package -- … YOUR-CLIENT-ID` → re-upload zip (manifest v1.0.1)
- [ ] Verify `/api/health` shows `"teamsSso": true`

**Already built (agent):**

- [x] `getAuthToken()` → `POST /api/auth/teams` → Entra JWT verify → Clerk sign-in token
- [x] Auto-create Clerk user by Teams email; link Neon user row for licenses / shop
- [x] Teams banner: “Signed in with Microsoft Teams” when SSO succeeds

### A8. Production / Teams Store (much later)

Full roadmap: **[teams-app/GO-LIVE.md](./teams-app/GO-LIVE.md)**

- [ ] **Manifest copy & legal URLs** — [teams-app/PRE-LAUNCH.md](./teams-app/PRE-LAUNCH.md)
- [ ] Railway paid, Stripe live, production domains
- [ ] Partner Center + Teams Store submission
- [ ] Kahoot model — external orgs install from Store; players use their own tenants

### A9. Meeting apps — how to add InGroups (read this)

**Known Teams behavior:** Custom/org apps often **do not appear** in the in-meeting **Apps** picker or the calendar invite **Apps** list — even when published correctly. This affects many sideloaded apps, not just InGroups. Microsoft’s own meeting sample uses a different flow.

#### Method that works today (Microsoft-documented)

1. **Calendar** → schedule a meeting (must exist before step 2).
2. Left sidebar **Apps** → search **InGroups** (Built for your org).
3. On the InGroups app page, click **Add** (or the **▼** next to Add) → **Add to a meeting**.
4. Select your scheduled meeting → **Set up a tab** → **Save** (config page may appear briefly).
5. **Join** the meeting → click the **InGroups** tab in the meeting toolbar → side panel opens.

#### If InGroups doesn’t appear in left-sidebar Apps

- Admin Center → InGroups → **Users and groups** → **Edit availability** → **Everyone** + **Install**.
- Confirm status is **Allowed**, not Blocked.
- Re-upload manifest **v1.0.2+** (adds meeting `staticTabs` per Microsoft hello-world-in-meeting sample).
- Propagation can take up to 24 hours.

#### What usually does *not* work for custom apps

- Browsing “Added by your organization” during a call (often only Copilot / featured apps).
- In-meeting **Apps** search (Store apps dominate).

**Meeting type reminder:** Instant **channel** Meet now (e.g. General) does not support apps. Use **Calendar** Meet now or a **scheduled** meeting.

---

## Part B — Zoom setup

Zoom is **separate** from Microsoft. No M365 tenant required. Apps run **inside the Zoom desktop/mobile client** (not a normal browser tab).

### B0. Prerequisites

| Need | Notes |
|------|--------|
| Zoom account | Free or paid; admin role can create apps |
| Zoom desktop client | Required for real testing (Mac app) |
| HTTPS app URL | Cloudflare Pages (`/zoom` route) or tunnel for local dev |
| Mac | Supported |

### B1. Create Zoom App (you)

1. [marketplace.zoom.us](https://marketplace.zoom.us) → sign in
2. **Develop → Build app**
3. Choose **General app** (OAuth) with **Zoom App** features enabled  
   (Legacy flow may label this **Zoom Apps** tile — use current Marketplace UI.)
4. **User-managed** app (each user installs/authorizes individually)

### B2. Configure app in Marketplace (you)

**Basic info:** name `InGroups`, short description, developer contact.

**Features → Zoom App:**

| Field | Value |
|-------|--------|
| Home URL | `https://YOUR-PAGES-URL/zoom` |
| Domain allow list | Your Pages domain (no `https://`), e.g. `ingroups.pages.dev` |
| | `appssdk.zoom.us` (Zoom Apps SDK CDN) |
| | Railway host if client calls API directly |

**OAuth:**

| Field | Value |
|-------|--------|
| Redirect URL | `https://YOUR-PAGES-URL/zoom/auth` (or server callback path) |
| OAuth allow list | Same origin as redirect |

**Scopes (minimum to start):**

- `zoomapp:inmeeting` — run during meetings
- Add SDK APIs as needed: `getMeetingContext`, `getUserContext`, `shareApp`, etc.

Save **Development** Client ID + Client Secret (not Production until publish).

### B3. Local dev tunnel (optional — you)

If testing against localhost:

- `ngrok http 5173` (or your dev port)
- Update **Home URL**, **Redirect URL**, and allow lists whenever ngrok URL changes (free tier rotates)

Production path: skip ngrok; use Cloudflare Pages staging URL.

### B4. Code + deploy (agent — when you ask)

Ask: *"Build Zoom App v0"*

Agent will:

- [ ] Add `/zoom` route + `@zoom/appssdk` (or CDN) + `zoomSdk.config()`
- [ ] OAuth callback route for Zoom user authorization
- [ ] Browser fallback when not inside Zoom client (dev preview)
- [ ] Same Socket.io game; entry adapter only
- [ ] Map Zoom user → Clerk user (similar bridge to Teams, via OAuth not getAuthToken)

**Server env (Railway):** `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, redirect URI.

### B5. Install and test (you)

1. Marketplace → your app → **Local Test** (or **Development** section)
2. **Add app now** → Allow
3. Open **Zoom desktop** (Mac) → Apps → InGroups  
   Or join a meeting → Apps panel → open InGroups
4. **Beta limit:** only users on **your Zoom account** can test until Marketplace publish (similar to Teams sideload vs Store).

### B6. Multi-user Zoom testing (you)

| Stage | Who can test |
|-------|----------------|
| Development / Local Test | Users on **your Zoom account** only |
| Published on Marketplace | Any Zoom user whose org allows the app |

For friends outside your Zoom account: publish (or use standalone **web** link for gameplay until then).

### B7. Production (later)

- [ ] Marketplace security review
- [ ] Switch to Production credentials
- [ ] List app for public install (Kahoot-like distribution)

---

## Teams vs Zoom (quick reference)

| | **Teams** | **Zoom** |
|---|-----------|----------|
| Dev account | M365 Business tenant (you have this) | Zoom Marketplace developer |
| Runs in | Teams iframe (web + desktop) | **Zoom client only** |
| First test path | Sideload manifest zip | Marketplace → Local Test → Add app |
| Pre-publish testers | Your tenant users (+ licenses) | Your Zoom account users |
| Post-publish | Teams Store / org catalog | Zoom Marketplace |
| Silent SSO | `getAuthToken()` (Entra) | Zoom OAuth + SDK |
| Mac dev | Yes | Yes (Zoom desktop required) |

**Recommended order:** Teams sideload v0 first (aligned with current tenant work), then Zoom v0.

---

## Resume prompts

| Goal | Say to agent |
|------|----------------|
| Teams tab loads in iframe | *Build Teams sideload v0 — Pages URL is …* |
| Teams SSO + shop | *Build Teams auth bridge — Azure app ID is …* |
| Zoom in-client app | *Build Zoom App v0 — Client ID is …* |
