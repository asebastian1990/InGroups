# InGroups Teams app package

Sideload package for Microsoft Teams (development).

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

## Sideload

1. Teams → **Apps → Manage your apps → Upload an app → Upload a custom app**
2. Select `ingroups-teams.zip`
3. Test **Personal** tab first, then add to a **meeting side panel**

## Scopes in this manifest

| Scope | URL |
|-------|-----|
| Personal tab | `/teams` |
| Team / chat / meeting | `/teams/config` (save) → `/teams` |
