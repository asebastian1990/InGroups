#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const teamsDir = join(__dirname, '..', 'teams-app');

const pagesUrl = process.argv[2]?.replace(/\/+$/, '');
const railwayUrl = process.argv[3]?.replace(/\/+$/, '');
const aadClientId = process.argv[4]?.trim();

if (!pagesUrl || !railwayUrl) {
  console.error('Usage: npm run teams:package -- <pages-url> <railway-url> [azure-client-id]');
  console.error(
    'Example: npm run teams:package -- https://ingroups.pages.dev https://ingroups-production.up.railway.app YOUR-AAD-CLIENT-ID',
  );
  process.exit(1);
}

let pagesHost;
let railwayHost;
try {
  pagesHost = new URL(pagesUrl).host;
  railwayHost = new URL(railwayUrl).host;
} catch {
  console.error('Invalid URL(s). Include https://');
  process.exit(1);
}

if (!aadClientId) {
  console.warn('\nWarning: no Azure client ID passed. Teams SSO will not work until you re-package with the 3rd argument.\n');
}

const appUri = aadClientId ? `api://${pagesHost}/${aadClientId}` : `api://YOUR-PAGES-HOST/YOUR-AAD-CLIENT-ID`;

const template = readFileSync(join(teamsDir, 'manifest.template.json'), 'utf8');
let manifest = template
  .replaceAll('https://YOUR-PAGES-URL', pagesUrl)
  .replaceAll('YOUR-PAGES-HOST', pagesHost)
  .replaceAll('YOUR-RAILWAY-HOST', railwayHost)
  .replaceAll('YOUR-AAD-CLIENT-ID', aadClientId || 'YOUR-AAD-CLIENT-ID')
  .replaceAll('api://YOUR-PAGES-HOST/YOUR-AAD-CLIENT-ID', appUri);

writeFileSync(join(teamsDir, 'manifest.json'), manifest);

const zipPath = join(teamsDir, 'ingroups-teams.zip');
execSync(`zip -j "${zipPath}" manifest.json color.png outline.png`, { cwd: teamsDir, stdio: 'inherit' });

console.log(`\nWrote ${join(teamsDir, 'manifest.json')}`);
console.log(`Created ${zipPath}`);
if (aadClientId) {
  console.log(`\nTeams SSO App URI: ${appUri}`);
  console.log('Set Railway env: TEAMS_AAD_CLIENT_ID and TEAMS_AAD_APP_URI to match.');
}
console.log('\nSideload: Teams → Apps → Manage your apps → Upload a custom app');
