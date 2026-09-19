/** Must match teams-app/manifest.template.json */
export const TEAMS_APP_ID = 'f8e3b2a1-4c5d-6e7f-8901-234567890abc';
export const TEAMS_PERSONAL_TAB_ID = 'ingroups-personal';

/** Deep link that opens the InGroups personal tab in Microsoft Teams. */
export function teamsTabDeepLink(path = '/teams?view=license'): string {
  const webUrl = `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`;
  return `https://teams.microsoft.com/l/entity/${TEAMS_APP_ID}/${TEAMS_PERSONAL_TAB_ID}?webUrl=${encodeURIComponent(webUrl)}`;
}
