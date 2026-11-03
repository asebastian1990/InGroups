const STORAGE_KEY = 'ingroups.teamsTheme';

type TeamsThemeSnapshot = {
  dark: boolean;
  contrast: boolean;
  meeting: boolean;
};

export function persistTeamsThemeSnapshot(): void {
  const snapshot: TeamsThemeSnapshot = {
    dark: document.body.classList.contains('teams-theme-dark'),
    contrast: document.body.classList.contains('teams-theme-contrast'),
    meeting: document.body.classList.contains('teams-meeting-surface'),
  };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* private mode / quota */
  }
}

/** Re-apply theme classes after a full-page navigation (e.g. legal → /teams). */
export function restoreTeamsThemeSnapshot(): void {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const snapshot = JSON.parse(raw) as TeamsThemeSnapshot;
    document.body.classList.remove(
      'teams-theme-dark',
      'teams-theme-contrast',
      'teams-meeting-surface',
    );
    if (snapshot.meeting) {
      document.body.classList.add('teams-meeting-surface');
    }
    if (snapshot.contrast) {
      document.body.classList.add('teams-theme-contrast');
    } else if (snapshot.dark) {
      document.body.classList.add('teams-theme-dark');
    }
  } catch {
    /* ignore corrupt snapshot */
  }
}
