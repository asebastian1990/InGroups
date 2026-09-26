import { useEffect, useRef, useState } from 'react';
import { getTeamsSignInApi } from './teamsSignInApi';
import { runTeamsTicketSso, type TeamsSsoResult } from './runTeamsTicketSso';

export type { TeamsSsoResult };

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

    void runTeamsTicketSso().then((result) => {
      if (!cancelled) {
        onCompleteRef.current(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [signInReady]);

  return null;
}
