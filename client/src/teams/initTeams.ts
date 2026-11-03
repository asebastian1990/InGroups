import { app } from '@microsoft/teams-js';
import type { TeamsProfile } from './types';
import { defaultTeamsProfile } from './types';
import { notifyTeamsContentFailure } from './teamsNativeLoading';
import { persistTeamsThemeSnapshot } from './teamsThemePersist';

/** In-meeting surfaces must stay dark even when Teams reports theme "default". */
const MEETING_FRAME_CONTEXTS = new Set([
  'meetingSidePanel',
  'meetingChatTab',
  'meetingDetailsTab',
  'meetingStage',
]);

let forceMeetingDarkTheme = false;

function shouldForceMeetingDarkTheme(
  ctx: Awaited<ReturnType<typeof app.getContext>>
): boolean {
  const frameContext = ctx.page?.frameContext;
  if (frameContext && MEETING_FRAME_CONTEXTS.has(frameContext)) {
    return true;
  }
  return Boolean(ctx.meeting?.id);
}

function applyTeamsTheme(theme?: string): void {
  document.body.classList.remove(
    'teams-theme-dark',
    'teams-theme-contrast',
    'teams-meeting-surface'
  );
  if (forceMeetingDarkTheme) {
    document.body.classList.add('teams-meeting-surface');
  }
  if (theme === 'contrast') {
    document.body.classList.add('teams-theme-contrast');
    return;
  }
  if (forceMeetingDarkTheme || theme === 'dark') {
    document.body.classList.add('teams-theme-dark');
  }
  persistTeamsThemeSnapshot();
}

function profileFromContext(ctx: Awaited<ReturnType<typeof app.getContext>>): TeamsProfile {
  return {
    inTeams: true,
    displayName: ctx.user?.displayName ?? null,
    loginHint: ctx.user?.loginHint ?? ctx.user?.userPrincipalName ?? null,
    userId: ctx.user?.id ?? null,
    meetingId: ctx.meeting?.id ?? null,
    frameContext: ctx.page?.frameContext ?? null,
    signedInWithTeams: false,
    signedInEmail: null,
  };
}

/** Initialize Teams JS SDK when running inside Teams. Returns profile hints from context. */
export async function initTeamsClient(): Promise<TeamsProfile> {
  try {
    await app.initialize();
    const ctx = await app.getContext();
    forceMeetingDarkTheme = shouldForceMeetingDarkTheme(ctx);
    applyTeamsTheme(ctx.app.theme);
    app.registerOnThemeChangeHandler((theme) => {
      applyTeamsTheme(theme);
    });
    return profileFromContext(ctx);
  } catch (err) {
    console.warn('[teams] app.initialize failed:', err);
    notifyTeamsContentFailure('Failed to initialize InGroups in Microsoft Teams.');
    return { ...defaultTeamsProfile };
  }
}
