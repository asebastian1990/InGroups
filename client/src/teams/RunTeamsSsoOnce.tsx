import { useSignIn } from '@clerk/clerk-react';
import { useEffect, useRef } from 'react';
import { authentication } from '@microsoft/teams-js';
import { exchangeTeamsSsoToken } from '../api';
import { withTimeout } from './withTimeout';

const TEAMS_SSO_TOKEN_TIMEOUT_MS = 15_000;

export type TeamsSsoResult =
  | { ok: true; email: string | null; displayName: string | null }
  | { ok: false };

/** Runs Teams ticket SSO once, then unmounts — keeps useSignIn out of the main app tree. */
export function RunTeamsSsoOnce({ onComplete }: { onComplete: (result: TeamsSsoResult) => void }) {
  const { isLoaded, signIn, setActive } = useSignIn();
  const startedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!isLoaded || !signIn || !setActive || startedRef.current) return;
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
        const attempt = await signIn.create({ strategy: 'ticket', ticket: signInToken });
        if (attempt.status !== 'complete' || !attempt.createdSessionId) {
          throw new Error('Clerk sign-in did not complete.');
        }
        await setActive({ session: attempt.createdSessionId });
        await new Promise((resolve) => setTimeout(resolve, 150));
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
  }, [isLoaded, signIn, setActive]);

  return null;
}
