const STORAGE_KEY = 'ingroups.teamsTheme';
const PREVIEW_KEY = 'ingroups.previewTeamsTheme';

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

/**
 * Local check for the meeting dark theme without a Teams client that reproduces
 * Microsoft's bug. Open `/teams?previewTeamsTheme=dark` or `=hostile`.
 * `hostile` injects white !important backgrounds and light :root variables, which
 * matches a host stylesheet overriding the tab. The panel should stay dark.
 */
export function applyTeamsThemePreviewFromQuery(): void {
  const fromQuery = new URLSearchParams(window.location.search).get('previewTeamsTheme');
  if (fromQuery === 'off') {
    try {
      sessionStorage.removeItem(PREVIEW_KEY);
    } catch {
      /* ignore */
    }
    return;
  }
  if (fromQuery === 'dark' || fromQuery === 'hostile') {
    try {
      sessionStorage.setItem(PREVIEW_KEY, fromQuery);
    } catch {
      /* ignore */
    }
  }
  let stored: string | null = null;
  try {
    stored = sessionStorage.getItem(PREVIEW_KEY);
  } catch {
    stored = null;
  }
  const mode = fromQuery === 'dark' || fromQuery === 'hostile' ? fromQuery : stored;
  if (mode !== 'dark' && mode !== 'hostile') return;
  document.body.classList.add('teams-theme-dark', 'teams-meeting-surface');
  if (mode !== 'hostile') return;
  const style = document.createElement('style');
  style.id = 'teams-theme-hostile-sim';
  style.textContent = `
    :root {
      --dark: #ffffff !important;
      --white: #ffffff !important;
      --gray-100: #ffffff !important;
      --gray-200: #f2f2f2 !important;
      --gray-300: #f7f7f7 !important;
      --gray-400: #ffffff !important;
      --gray-600: #f5f5f5 !important;
    }
    body, #root, .app, .app-content, .room-code-banner, .app-header, .menu-item, .btn {
      background: #ffffff !important;
      background-color: #ffffff !important;
      color: #ffffff !important;
    }
  `;
  document.head.appendChild(style);
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
