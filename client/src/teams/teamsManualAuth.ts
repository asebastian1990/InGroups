/** Legacy flag — no longer used; clear so reopen runs Teams SSO. */
try {
  sessionStorage.removeItem('ingroups_teams_skip_auto_sso');
} catch {
  // Ignore private mode / blocked storage.
}

/** In-tab only — cleared on full reload unless ?signedOut=1 is present. */
let skipAutoSsoThisLoad = false;

export const TEAMS_SIGNED_OUT_PARAM = 'signedOut';
export const TEAMS_HOME = '/teams';

export function teamsHomeWithSignedOut(): string {
  return `${TEAMS_HOME}?${TEAMS_SIGNED_OUT_PARAM}=1`;
}

/** True when the user chose sign-out / manual auth (not a fresh Teams app open). */
export function consumeTeamsSignedOutFromUrl(): boolean {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get(TEAMS_SIGNED_OUT_PARAM) !== '1') return false;
    url.searchParams.delete(TEAMS_SIGNED_OUT_PARAM);
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(null, '', next || TEAMS_HOME);
    skipAutoSsoThisLoad = true;
    return true;
  } catch {
    return false;
  }
}

export function markTeamsSignedOut(): void {
  skipAutoSsoThisLoad = true;
}

export function clearTeamsManualAuth(): void {
  skipAutoSsoThisLoad = false;
}

export function shouldSkipTeamsAutoSso(): boolean {
  return skipAutoSsoThisLoad;
}
