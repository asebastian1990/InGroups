import { authentication } from '@microsoft/teams-js';
import { exchangeTeamsSsoToken } from '../api';
import { getTeamsSignInApi } from './teamsSignInApi';
import { withTimeout } from './withTimeout';
const TEAMS_SSO_TOKEN_TIMEOUT_MS = 15_000;

export type TeamsSsoResult =
  | { ok: true; email: string | null; displayName: string | null }
  | { ok: false };

/** Exchange Teams SSO token for a Clerk session (ticket strategy). */
export async function runTeamsTicketSso(): Promise<TeamsSsoResult> {
  try {
    const teamsToken = await withTimeout(
      authentication.getAuthToken(),
      TEAMS_SSO_TOKEN_TIMEOUT_MS,
      'Teams SSO token',
    );
    const { signInToken, email, displayName } = await exchangeTeamsSsoToken(teamsToken);
    const { signIn, setActive } = getTeamsSignInApi() ?? {};
    if (!signIn || !setActive) {
      throw new Error('Clerk sign-in is unavailable.');
    }
    const attempt = await signIn.create({ strategy: 'ticket', ticket: signInToken });
    if (attempt.status !== 'complete' || !attempt.createdSessionId) {
      throw new Error('Clerk sign-in did not complete.');
    }
    await setActive({ session: attempt.createdSessionId });
    return { ok: true, email, displayName };
  } catch (err) {
    console.warn('Teams SSO failed:', err);
    return { ok: false };
  }
}
