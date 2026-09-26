import { useEffect, useRef, useState } from 'react';
import { authentication } from '@microsoft/teams-js';
import { exchangeTeamsSsoToken } from '../api';
import { getTeamsSignInApi } from './teamsSignInApi';
import { withTimeout } from './withTimeout';

const TEAMS_SSO_TOKEN_TIMEOUT_MS = 15_000;

export type TeamsSsoResult =
  | { ok: true; email: string | null; displayName: string | null }
  | { ok: false };

/** Runs Teams ticket SSO once using the persistent TeamsClerkSignInHost sign-in API. */
export function RunTeamsSsoOnce({ onComplete }: { onComplete: (result: TeamsSsoResult) => void }) {
  const startedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const [signInReady, setSignInReady] = useState(() => getTeamsSignInApi() !== null);

  useEffect(() => {
    if (signInReady) return;
    const id = window.setInterval(() => {
      if (getTeamsSignInApi()) {
        setSignInReady(true);
        window.clearInterval(id);
      }
    }, 50);
    return () => window.clearInterval(id);
  }, [signInReady]);

  useEffect(() => {
    if (!signInReady || startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;

    (async () => {
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
        if (!cancelled) {
          onCompleteRef.current({ ok: true, email, displayName });
        }
      } catch (err) {
        console.warn('Teams SSO failed:', err);
        if (!cancelled) {
          onCompleteRef.current({ ok: false });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [signInReady]);

  return null;
}
