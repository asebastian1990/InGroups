import { useAuth, useSignIn } from '@clerk/clerk-react';
import { useEffect, useState, type ReactNode } from 'react';
import { authentication } from '@microsoft/teams-js';
import {
  configureAuth,
  configureGuestAuth,
  exchangeTeamsSsoToken,
  getTeamsSsoStatus,
  syncAuthenticatedUser,
} from '../api';
import { initTeamsClient } from './initTeams';
import { TeamsEmbedProvider } from './TeamsEmbedContext';
import type { TeamsProfile } from './types';
import { defaultTeamsProfile } from './types';

function LoadingScreen() {
  return (
    <div className="app app--teams">
      <main className="app-content auth-screen">
        <p className="muted">Connecting to Microsoft Teams…</p>
      </main>
    </div>
  );
}

export function TeamsAuthBootstrap({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { isLoaded: signInLoaded, signIn, setActive } = useSignIn();
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<TeamsProfile>(defaultTeamsProfile);

  useEffect(() => {
    if (!isLoaded || !signInLoaded) return;

    let cancelled = false;

    (async () => {
      const ctxProfile = await initTeamsClient();
      if (cancelled) return;

      let nextProfile: TeamsProfile = { ...ctxProfile };

      try {
        if (isSignedIn) {
          configureAuth(() => getToken());
          await syncAuthenticatedUser(getToken).catch((err) => {
            console.warn('Failed to sync account with server:', err);
          });
          nextProfile = {
            ...nextProfile,
            signedInWithTeams: true,
            signedInEmail: null,
          };
        } else {
          const ssoEnabled = await getTeamsSsoStatus();
          if (ssoEnabled && ctxProfile.inTeams) {
            try {
              const teamsToken = await authentication.getAuthToken();
              const { signInToken, email, displayName } = await exchangeTeamsSsoToken(teamsToken);

              if (!signIn) {
                throw new Error('Clerk sign-in is unavailable.');
              }

              const attempt = await signIn.create({ strategy: 'ticket', ticket: signInToken });
              if (attempt.status !== 'complete' || !attempt.createdSessionId) {
                throw new Error('Clerk sign-in did not complete.');
              }

              await setActive!({ session: attempt.createdSessionId });
              configureAuth(() => getToken());
              await syncAuthenticatedUser(getToken).catch((err) => {
                console.warn('Failed to sync account with server:', err);
              });

              nextProfile = {
                ...nextProfile,
                displayName: displayName ?? nextProfile.displayName,
                signedInWithTeams: true,
                signedInEmail: email,
              };
            } catch (err) {
              console.warn('Teams SSO unavailable, using guest mode:', err);
              configureGuestAuth();
            }
          } else {
            configureGuestAuth();
          }
        }

        if (!cancelled) {
          setProfile(nextProfile);
          setReady(true);
        }
      } catch (err) {
        console.error('Teams bootstrap error:', err);
        configureGuestAuth();
        if (!cancelled) {
          setProfile(nextProfile);
          setReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, signInLoaded, isSignedIn, getToken, signIn, setActive]);

  if (!ready) return <LoadingScreen />;

  return <TeamsEmbedProvider profile={profile}>{children}</TeamsEmbedProvider>;
}
