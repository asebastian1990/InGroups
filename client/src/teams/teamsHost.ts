/** Host names from TeamsJS `app.Context.app.host.name` (lowercase). */
const TEAMS_PRODUCT_HOSTS = new Set(['teams', 'teamsmodern']);

export function normalizeTeamsHostName(hostName: string | null | undefined): string | null {
  if (hostName == null) return null;
  const trimmed = hostName.trim();
  if (!trimmed) return null;
  return trimmed.toLowerCase();
}

/** True when the app should run (Teams desktop/web/meeting surfaces). */
export function isInGroupsTeamsHost(hostName: string | null | undefined): boolean {
  const normalized = normalizeTeamsHostName(hostName);
  if (!normalized || normalized === 'unknown') {
    return true;
  }
  return TEAMS_PRODUCT_HOSTS.has(normalized);
}

/** True in Outlook, Office, M365 app, etc. — not the Teams client. */
export function isBlockedMicrosoft365Host(hostName: string | null | undefined): boolean {
  const normalized = normalizeTeamsHostName(hostName);
  if (!normalized || normalized === 'unknown') {
    return false;
  }
  return !TEAMS_PRODUCT_HOSTS.has(normalized);
}
