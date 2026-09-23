# InGroups Teams app package

Sideload package for Microsoft Teams (development).

**Production subdomain cutover:** [PRE-LAUNCH.md](./PRE-LAUNCH.md) (`ingroups.annaliese-sebastian.com`).

## Before packaging

1. Deploy the client to Cloudflare Pages (with `/teams` route live).
2. Ensure Railway `CORS_ORIGIN` includes your Pages URL.

## Generate manifest

Replace placeholders with your real URLs (no trailing slashes on origins):

```bash
cd teams-app
export PAGES_URL="https://your-project.pages.dev"
export PAGES_HOST="your-project.pages.dev"
export RAILWAY_HOST="your-app.up.railway.app"

sed \
  -e "s|https://YOUR-PAGES-URL|${PAGES_URL}|g" \
  -e "s|YOUR-PAGES-HOST|${PAGES_HOST}|g" \
  -e "s|YOUR-RAILWAY-HOST|${RAILWAY_HOST}|g" \
  manifest.template.json > manifest.json
```

Or run from repo root (add Azure client ID for SSO — see **AZURE-SSO-SETUP.md**):

```bash
npm run teams:package -- https://ingroups.pages.dev https://ingroups-production.up.railway.app YOUR-AAD-CLIENT-ID
```

## Create zip (manual alternative)

From **inside** `teams-app/` (files at zip root):

```bash
zip -j ingroups-teams.zip manifest.json color.png outline.png
```

On Mac, select the three files → Compress (ensure `manifest.json` is not inside a subfolder).

## Sideload (personal tab — dev)

1. Teams → **Apps → Manage your apps → Upload an app → Upload a custom app**
2. Select `ingroups-teams.zip`
3. Test **Personal** tab first

## Meetings (org catalog — required for in-call Apps menu)

Personal sideload does **not** put the app in the meeting **Apps** gallery. Upload the same zip in **[Teams Admin Center → Teams apps → Manage apps → Upload new app](https://admin.teams.microsoft.com)**.

If InGroups doesn’t appear **during a call’s Apps menu**, that’s normal for custom apps. Use **Apps (sidebar) → InGroups → Add → Add to a meeting** before joining. See **INTEGRATIONS-SETUP.md → A9**.

Re-upload manifest **v1.0.2+** in Admin Center after `npm run teams:package` (adds meeting static tab per Microsoft’s meeting sample).

## Before go-live

See **[PRE-LAUNCH.md](./PRE-LAUNCH.md)** — update privacy URL, terms URL, short/long description in the manifest before Store or public org release.

## Scopes in this manifest

| Scope | URL |
|-------|-----|
| Personal tab | `/teams` |
| Team / chat / meeting | `/teams/config` (save) → `/teams` |
