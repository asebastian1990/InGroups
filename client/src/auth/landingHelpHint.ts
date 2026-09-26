const STORAGE_KEY = 'ingroups-landing-help-hint';
const OAUTH_PENDING_KEY = 'ingroups-oauth-help-pending';

export function markLandingHelpHint(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // Ignore private mode / blocked storage.
  }
}

export function markOAuthHelpHintPending(): void {
  try {
    sessionStorage.setItem(OAUTH_PENDING_KEY, '1');
  } catch {
    // Ignore private mode / blocked storage.
  }
}

export function clearOAuthHelpHintPending(): void {
  try {
    sessionStorage.removeItem(OAUTH_PENDING_KEY);
  } catch {
    // Ignore private mode / blocked storage.
  }
}

/** Call on the home screen after a successful OAuth redirect completes. */
export function confirmOAuthHelpHintIfPending(): void {
  try {
    if (sessionStorage.getItem(OAUTH_PENDING_KEY) !== '1') return;
    sessionStorage.removeItem(OAUTH_PENDING_KEY);
    markLandingHelpHint();
  } catch {
    // Ignore private mode / blocked storage.
  }
}

export function peekLandingHelpHint(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function consumeLandingHelpHint(): boolean {
  try {
    if (sessionStorage.getItem(STORAGE_KEY) !== '1') return false;
    sessionStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
