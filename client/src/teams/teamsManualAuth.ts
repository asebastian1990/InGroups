const SKIP_AUTO_SSO_KEY = 'ingroups_teams_skip_auto_sso';

/** User signed out or chose manual auth — do not silently re-run Teams SSO. */
export function markTeamsManualAuth(): void {
  try {
    sessionStorage.setItem(SKIP_AUTO_SSO_KEY, '1');
  } catch {
    // Ignore private mode / blocked storage.
  }
}

export function clearTeamsManualAuth(): void {
  try {
    sessionStorage.removeItem(SKIP_AUTO_SSO_KEY);
  } catch {
    // Ignore private mode / blocked storage.
  }
}

export function shouldSkipTeamsAutoSso(): boolean {
  try {
    return sessionStorage.getItem(SKIP_AUTO_SSO_KEY) === '1';
  } catch {
    return false;
  }
}
