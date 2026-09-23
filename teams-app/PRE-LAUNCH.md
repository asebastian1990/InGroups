# Teams app — before public / Store launch

Internal checklist for moving from dev (`ingroups.pages.dev`) to production on `ingroups.annaliese-sebastian.com`. The main site at `annaliese-sebastian.com` stays separate; the subdomain hosts the app, Teams tab, and legal pages.

See also: [GO-LIVE.md](./GO-LIVE.md) (Store checklist), [AZURE-SSO-SETUP.md](./AZURE-SSO-SETUP.md).

---

## Production URLs (target state)


| Purpose               | URL                                                          |
| --------------------- | ------------------------------------------------------------ |
| Web app (landing)     | `https://ingroups.annaliese-sebastian.com/`                  |
| Teams tab             | `https://ingroups.annaliese-sebastian.com/teams`             |
| Teams config          | `https://ingroups.annaliese-sebastian.com/teams/config`      |
| Stripe return (Teams) | `https://ingroups.annaliese-sebastian.com/purchase/complete` |
| Clerk sign-in         | `https://ingroups.annaliese-sebastian.com/sign-in`           |
| Privacy policy        | `https://ingroups.annaliese-sebastian.com/privacypolicy`     |
| Terms of use          | `https://ingroups.annaliese-sebastian.com/termsofuse`        |


---



## Step 1 — Cloudflare: attach the subdomain

From the Cloudflare account home:

1. Left sidebar → **Build** → **Compute**
2. **Workers & Pages**
3. Open the **InGroups** Pages project (currently `ingroups.pages.dev` — not `as-website` or other Workers)
4. **Custom domains** (or **Settings → Domains**)
5. **Set up a custom domain** → enter `ingroups.annaliese-sebastian.com`
6. Confirm. Cloudflare should create the DNS record automatically because `annaliese-sebastian.com` is already in this account.

**Timing:** Cloudflare may show “up to 48 hours” for DNS/SSL propagation. Often it is much faster (minutes). Wait until the domain shows **Active** before cutting over Azure/Teams.

**Optional during migration:** keep `ingroups.pages.dev` on the same Pages project so old Teams installs still work until you re-upload the manifest.

**If DNS was not auto-created:** **Domains** → **annaliese-sebastian.com** → **DNS** → confirm a CNAME for `ingroups` pointing at the Pages project hostname.

**Test:** `https://ingroups.annaliese-sebastian.com` loads the same app as `ingroups.pages.dev`.

---



## Step 2 — Railway (server env)

Railway → InGroups service → **Variables** → update and redeploy:


| Variable            | Value                                                                                                 |
| ------------------- | ----------------------------------------------------------------------------------------------------- |
| `CORS_ORIGIN`       | `https://ingroups.annaliese-sebastian.com` (optionally add `,https://ingroups.pages.dev` temporarily) |
| `APP_URL`           | `https://ingroups.annaliese-sebastian.com`                                                            |
| `TEAMS_AAD_APP_URI` | `api://ingroups.annaliese-sebastian.com/d9a7e57e-17b4-474a-b75e-ac9731d648fb`                         |


**Unchanged (unless you add a custom API host later):**

- Stripe webhook: `https://ingroups-production.up.railway.app/api/stripe/webhook`
- Cloudflare Pages `VITE_SERVER_URL`: `https://ingroups-production.up.railway.app`

**Used for:** API CORS, Stripe success/cancel redirects, Teams SSO JWT audience validation.

---



## Step 3 — Azure Entra (Teams SSO)

[portal.azure.com](https://portal.azure.com) → **InGroups** app → **Expose an API**:


| Field              | Value                                                                         |
| ------------------ | ----------------------------------------------------------------------------- |
| Application ID URI | `api://ingroups.annaliese-sebastian.com/d9a7e57e-17b4-474a-b75e-ac9731d648fb` |
| Scope              | `.../access_as_user` under that URI                                           |


Re-check **Authorized client applications** — both Teams client IDs must still have the scope ticked:

- Desktop: `1fec8e78-bce4-4aaf-ab1b-5451cc387264`
- Web: `5e3ce6c0-2b1f-4285-8d4b-75ee78787346`

Azure Application ID URI, Railway `TEAMS_AAD_APP_URI`, and manifest `webApplicationInfo.resource` must match **exactly**.

Verify: `https://ingroups-production.up.railway.app/api/health` → `"teamsSso": true` after Railway redeploy.

---



## Step 4 — Clerk (production instance)

PRE-LAUNCH ends with **production auth** — not the Development sandbox. Clerk **Development** (`pk_test_` / `sk_test_`) is for local and internal testing only. **Production** (`pk_live_` / `sk_live_`) is required for Store launch and real users.

| | Development | Production |
|---|-------------|------------|
| Keys | `pk_test_` / `sk_test_` | `pk_live_` / `sk_live_` |
| Google sign-in | Clerk shared dev credentials | **Your own** Google OAuth client |
| Domain | Fallback dev host / `*.accounts.dev` | Custom domain + DNS on `annaliese-sebastian.com` |
| User data | Test users | Real customer accounts |

Keep the Development instance for local work; create and configure **Production** for the live subdomain.

### 4a — Create the Production instance

1. [Clerk Dashboard](https://dashboard.clerk.com) → **InGroups**
2. Top-left **Development** dropdown → **Create production instance**
3. Choose **Clone development settings** (recommended)
4. Confirm you are on **Production** (no orange “Development” badge)

**Note:** Paths, social/OAuth connections, and some integrations **do not copy** — reconfigure them below on Production.

### 4b — Domains and DNS

1. **Configure → Domains**
2. Set production root domain: **`annaliese-sebastian.com`**
3. Add the DNS records Clerk shows in **Cloudflare → annaliese-sebastian.com → DNS**
   - Use **DNS only** (grey cloud) for Clerk CNAMEs if verification fails
4. Wait until Clerk shows the domain verified (can take up to 48 hours)
5. Click **Deploy certificates** when the dashboard enables it

**Configure → Allowed Subdomains** (recommended):

- Enable allowed subdomains
- Add **`ingroups.annaliese-sebastian.com`**

### 4c — Paths (sign-in on your app, not Account Portal)

**Configure → Paths**

| Field | Production value |
|-------|------------------|
| Sign-in URL | `https://ingroups.annaliese-sebastian.com/sign-in` |
| Sign-up URL | `https://ingroups.annaliese-sebastian.com/sign-in` |

InGroups uses embedded `<SignIn>` on `/sign-in` (see `client/src/auth.tsx`). Do **not** point users at Clerk Account Portal for normal sign-in.

**Configure → Account Portal → Redirects** (fallbacks only — use **relative** paths):

| Field | Value |
|-------|-------|
| After sign-in fallback | `/` |
| After sign-up fallback | `/` |

### 4d — Redirect URLs (if shown in dashboard)

**Configure → Developers → Redirect URLs** (or **Configure → Redirect URLs**):

- `https://ingroups.annaliese-sebastian.com`

Add `https://ingroups.annaliese-sebastian.com/*` only if the dashboard accepts wildcards. The app also sets `allowedRedirectOrigins` from `window.location.origin` in code.

### 4e — Google OAuth (Production — required)

Development’s shared Google credentials are **not** valid for public launch.

1. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → **Credentials** → create or reuse an **OAuth 2.0 Client ID** (Web application)
2. **Clerk Production → Configure → User & authentication → Social connections → Google**
3. Enable Google and paste your **Client ID** and **Client secret**
4. Copy Clerk’s **Authorized redirect URI** from that page into Google’s **Authorized redirect URIs**

Repeat for any other social providers you enable in Production.

### 4f — Swap API keys (Cloudflare + Railway)

**Clerk Production → Configure → API Keys**

| Where | Variable | Value |
|-------|----------|--------|
| **Cloudflare Pages** (Production env) | `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_...` |
| **Railway** | `CLERK_SECRET_KEY` | `sk_live_...` |

Also set on **Cloudflare Pages** (Production) if not already:

| Variable | Value |
|----------|--------|
| `VITE_CLERK_SIGN_IN_URL` | `/sign-in` |
| `VITE_CLERK_SIGN_UP_URL` | `/sign-in` |
| `VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `/` |
| `VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | `/` |

**Redeploy Cloudflare Pages** (client env vars are baked in at build time) and **redeploy Railway**. Client and server keys must both be from the **same** Production instance.

### 4g — What you do not need for Teams SSO

| Item | Why |
|------|-----|
| Clerk **Enterprise SSO** add-on ($75/connection) | Teams tab uses Entra JWT → Railway → Clerk sign-in token, not Clerk SAML |
| Migrating Development test users | Production starts fresh; testers sign up again on live |

### 4h — Verify Clerk on the subdomain

On `https://ingroups.annaliese-sebastian.com`:

1. Open `/sign-in` → sign in with **Google** and **email**
2. Confirm redirect lands on `/` (not `*.accounts.dev` or a Clerk error)
3. Host a game — socket auth must succeed (Railway `sk_live_` matches client `pk_live_`)
4. Open `/teams` → Teams SSO banner still works (Azure/Railway; independent of Clerk dev/prod, but Railway must use Production `CLERK_SECRET_KEY`)

---



## Step 5 — Legal pages on the subdomain

Source copy (markdown): [`legal/privacypolicy.md`](../legal/privacypolicy.md) and [`legal/termsofuse.md`](../legal/termsofuse.md).

The client renders these at `/privacypolicy` and `/termsofuse` (no auth wall). Edit the markdown files, then redeploy Cloudflare Pages. Use the same paths everywhere: manifest, Partner Center, footer links.

---



## Step 6 — Manifest copy, legal URLs, and package

Update `teams-app/manifest.template.json` developer block:

```json
"developer": {
  "websiteUrl": "https://YOUR-PAGES-URL",
  "privacyUrl": "https://YOUR-PAGES-URL/privacypolicy",
  "termsOfUseUrl": "https://YOUR-PAGES-URL/termsofuse"
}
```


| Field                     | Current (dev)                           | Before go-live                                                         |
| ------------------------- | --------------------------------------- | ---------------------------------------------------------------------- |
| `description.short`       | Align on a secret word with your group. | Polish for Store / org catalog (clear, professional, no typos).        |
| `description.full`        | One-line game summary.                  | Full feature list, audience, how many players, premium word sets, etc. |
| `developer.privacyUrl`    | `https://ingroups.pages.dev`            | `https://ingroups.annaliese-sebastian.com/privacypolicy`               |
| `developer.termsOfUseUrl` | `https://ingroups.pages.dev`            | `https://ingroups.annaliese-sebastian.com/termsofuse`                  |
| `developer.websiteUrl`    | `https://ingroups.pages.dev`            | `https://ingroups.annaliese-sebastian.com`                             |


Bump `"version"` (e.g. `1.0.2` → `1.0.3`), then package:

```bash
npm run teams:package -- https://ingroups.annaliese-sebastian.com https://ingroups-production.up.railway.app d9a7e57e-17b4-474a-b75e-ac9731d648fb
```

This sets:


| Manifest field                | Result                                                                   |
| ----------------------------- | ------------------------------------------------------------------------ |
| `validDomains`                | `ingroups.annaliese-sebastian.com`, `ingroups-production.up.railway.app` |
| `webApplicationInfo.resource` | `api://ingroups.annaliese-sebastian.com/d9a7e57e-...`                    |
| Tab URLs                      | `.../teams`, `.../teams/config`                                          |
| Legal URLs                    | `.../privacypolicy`, `.../termsofuse`                                    |


Upload `teams-app/ingroups-teams.zip` to **Teams Admin Center** (org catalog; meeting upload if used). Increment `"version"` for every re-upload.

---



## Step 7 — Partner Center (Store listing)

When filling the listing, use the **same URLs as the manifest**:

- Privacy → `https://ingroups.annaliese-sebastian.com/privacypolicy`
- Terms → `https://ingroups.annaliese-sebastian.com/termsofuse`
- Website / support → subdomain root or a support page on the subdomain

Microsoft checks that listing metadata matches the manifest.

---



## Org deployment (meetings)

Personal sideload ≠ in-meeting Apps gallery. For meetings, upload to **Teams Admin Center → Manage apps** and set availability (see README meeting section).

---



## What you do not need to change


| Item                                | Why                                                         |
| ----------------------------------- | ----------------------------------------------------------- |
| `client/public/_headers`            | Frame ancestors list Teams/Microsoft hosts, not your domain |
| Game / socket code                  | Uses `VITE_SERVER_URL` at build time                        |
| Stripe webhook URL                  | Still on Railway                                            |
| Main site `annaliese-sebastian.com` | Separate; only the subdomain points at Pages                |


---



## Recommended cutover order

```text
1. Cloudflare: add ingroups.annaliese-sebastian.com → wait until Active (up to 48h)
2. Publish /privacypolicy and /termsofuse on the subdomain
3. Railway: CORS_ORIGIN, APP_URL, TEAMS_AAD_APP_URI → redeploy
4. Azure: Application ID URI → match Railway
5. Clerk: create Production instance → Domains/DNS → Paths → Google OAuth → pk_live_/sk_live_ → redeploy Pages + Railway
6. Update manifest template → teams:package → upload new version to Teams Admin Center
7. Test: web sign-in (Google + email) → Teams SSO → Stripe checkout → privacy/terms links
8. Remove ingroups.pages.dev from CORS when confident
```

---



## Verification checklist


| Test                                       | Expected                                           |
| ------------------------------------------ | -------------------------------------------------- |
| `https://ingroups.annaliese-sebastian.com` | Landing loads                                      |
| `.../sign-in` (Google + email)             | Signs in; returns to `/` on Production Clerk keys  |
| `.../privacypolicy`, `.../termsofuse`      | Public, reachable                                  |
| Railway `/api/health`                      | `teamsSso: true`                                   |
| Teams personal tab                         | SSO works; no valid-domain errors                  |
| Stripe checkout                            | Returns to `.../purchase/complete`                 |


