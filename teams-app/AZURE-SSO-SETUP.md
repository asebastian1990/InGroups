# Teams SSO setup (one-time)

v0 sideload runs as guest without this. For **automatic sign-in + shop/licenses in Teams**, complete these steps.

## InGroups Azure app (your values)

| Field | Value |
|-------|--------|
| App name | `InGroups` |
| Application (client) ID | `d9a7e57e-17b4-474a-b75e-ac9731d648fb` |
| Object ID | `bcf4f374-f5cf-4bb5-9415-1d2b8981f6f8` |
| Directory (tenant) ID | `72e21bb1-be04-403a-a93b-4d5d52554597` |
| Application ID URI | `api://ingroups.pages.dev/d9a7e57e-17b4-474a-b75e-ac9731d648fb` |
| Pages URL | `https://ingroups.pages.dev` |
| Railway URL | `https://ingroups-production.up.railway.app` |

Direct link to your app (while signed in as DavidHau@AnnalieseSebastianLLC.onmicrosoft.com):

`https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/d9a7e57e-17b4-474a-b75e-ac9731d648fb`

---

## 1. Register the app in Azure — done

- [x] Name: `InGroups`
- [x] Supported account types: **Any Entra ID Tenant + Personal Microsoft accounts**
- [x] Application (client) ID: `d9a7e57e-17b4-474a-b75e-ac9731d648fb`

---

## 2. Expose an API (Teams SSO) — do this next

### How to find “Expose an API”

1. Open [portal.azure.com](https://portal.azure.com)
2. Search the top bar for **App registrations** → open it
3. Click your app **InGroups** (client ID ends in `…648fb`)
4. In the **left sidebar** under **Manage**, click **Expose an API**

   You should see a page titled **Expose an API** with a section **Application ID URI** near the top.

   Sidebar order (for reference): Overview → Authentication → … → **Expose an API** → App roles → …

### 2a. Set Application ID URI

1. On **Expose an API**, click **Set** (or **Add**) next to **Application ID URI**
2. Enter exactly:
   ```
   api://ingroups.pages.dev/d9a7e57e-17b4-474a-b75e-ac9731d648fb
   ```
3. Click **Save**

### 2b. Add scope

1. Still on **Expose an API**, click **+ Add a scope**
2. Confirm the URI if prompted, then fill in:

   | Field | Value |
   |-------|--------|
   | Scope name | `access_as_user` |
   | Who can consent | **Admins and users** |
   | Admin consent display name | `Access InGroups as you` |
   | Admin consent description | `Allow InGroups to access your profile for sign-in.` |
   | State | **Enabled** |

3. Click **Add scope**

### 2c. Authorize Teams client apps

1. On **Expose an API**, scroll to **Authorized client applications**
2. Click **+ Add a client application**
3. Add **Client ID** `1fec8e78-bce4-4aaf-ab1b-5451cc387264` (Teams mobile/desktop)  
   Check the box for scope `api://ingroups.pages.dev/d9a7e57e-17b4-474a-b75e-ac9731d648fb/access_as_user` → **Add application**
4. Click **+ Add a client application** again
5. Add **Client ID** `5e3ce6c0-2b1f-4285-8d4b-75ee78787346` (Teams web)  
   Check the same scope box → **Add application**

> **If the portal still errors** (“cannot be found”), use the **Manifest** workaround in step 2d below instead of the UI.

### 2d. Manifest workaround (if UI fails)

1. Left sidebar → **Manifest**
2. Find the `"api"` block. Add or update `"preAuthorizedApplications"` (use the scope **id** GUID from `"oauth2PermissionScopes"` — not the scope name):

   ```json
   "preAuthorizedApplications": [
     {
       "appId": "1fec8e78-bce4-4aaf-ab1b-5451cc387264",
       "delegatedPermissionIds": ["PASTE-SCOPE-ID-GUID-HERE"]
     },
     {
       "appId": "5e3ce6c0-2b1f-4285-8d4b-75ee78787346",
       "delegatedPermissionIds": ["PASTE-SCOPE-ID-GUID-HERE"]
     }
   ]
   ```

3. Click **Save** at the top of the Manifest page

---

## 3. Railway environment variables

In Railway → your InGroups service → **Variables**, add:

| Variable | Value |
|----------|--------|
| `TEAMS_AAD_CLIENT_ID` | `d9a7e57e-17b4-474a-b75e-ac9731d648fb` |
| `TEAMS_AAD_APP_URI` | `api://ingroups.pages.dev/d9a7e57e-17b4-474a-b75e-ac9731d648fb` |

Redeploy Railway after saving.

---

## 4. Re-package and re-upload Teams app

From repo root:

```bash
npm run teams:package -- https://ingroups.pages.dev https://ingroups-production.up.railway.app d9a7e57e-17b4-474a-b75e-ac9731d648fb
```

Upload the new `teams-app/ingroups-teams.zip` in Teams (replace existing app).

---

## 5. Verify

1. `https://ingroups-production.up.railway.app/api/health` → `"teamsSso": true`
2. Open InGroups in Teams → banner should say **Signed in with Microsoft Teams**
3. **License** menu item appears; shop uses your Teams-linked account
