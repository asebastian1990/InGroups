import { app } from '@microsoft/teams-js';
import type { TeamsProfile } from './types';
import { defaultTeamsProfile } from './types';

function applyTeamsTheme(theme?: string): void {
  document.body.classList.remove('teams-theme-dark', 'teams-theme-contrast');
  if (theme === 'dark') {
    document.body.classList.add('teams-theme-dark');
  } else if (theme === 'contrast') {
    document.body.classList.add('teams-theme-contrast');
  }
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
    applyTeamsTheme(ctx.app.theme);
    app.registerOnThemeChangeHandler((theme) => {
      applyTeamsTheme(theme);
    });
    return profileFromContext(ctx);
  } catch {
    return { ...defaultTeamsProfile };
  }
}
