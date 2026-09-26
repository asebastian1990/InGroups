import { useSignIn } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { setTeamsSignInApi } from './teamsSignInApi';

/** Keeps Clerk's sign-in resource mounted for the whole Teams session (ticket SSO needs this). */
export function TeamsClerkSignInHost() {
  const { isLoaded, signIn, setActive } = useSignIn();

  useEffect(() => {
    if (!isLoaded || !signIn || !setActive) return;
    setTeamsSignInApi({ signIn, setActive });
  }, [isLoaded, signIn, setActive]);

  return null;
}
