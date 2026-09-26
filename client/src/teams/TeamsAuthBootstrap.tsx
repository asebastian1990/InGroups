import { useAuth, useSignIn } from '@clerk/clerk-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { authentication } from '@microsoft/teams-js';
import {
  configureAuth,
  configureGuestAuth,
  exchangeTeamsSsoToken,
  getTeamsSsoStatus,
  syncAuthenticatedUser,
} from '../api';
import { markLandingHelpHint } from '../auth/landingHelpHint';
import { initTeamsClient } from './initTeams';
import { TeamsEmbedProvider } from './TeamsEmbedContext';
import { TeamsManualSignInScreen } from './TeamsManualSignInScreen';
import type { TeamsProfile } from './types';
import { defaultTeamsProfile } from './types';
import {
  clearTeamsManualAuth,
  markTeamsManualAuth,
  shouldSkipTeamsAutoSso,
} from './teamsManualAuth';
import { withTimeout } from './withTimeout';

const CLERK_LOAD_TIMEOUT_MS = 12_000;
const TEAMS_SSO_TOKEN_TIMEOUT_MS = 15_000;

function LoadingScreen({ detail }: { detail?: string }) {
  return (
    <div className="app app--teams">
      <main className="app-content auth-screen">
        <p className="muted">Connecting to Microsoft Teams…</p>
        {detail && <p className="auth-form-lead">{detail}</p>}
      </main>
    </div>
  );
}

export function TeamsAuthBootstrap({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { isLoaded: signInLoaded, signIn, setActive } = useSignIn();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const signInRef = useRef(signIn);
  signInRef.current = signIn;
  const setActiveRef = useRef(setActive);
  setActiveRef.current = setActive;
  const wasSignedInRef = useRef(isSignedIn);

  const teamsCtxRef = useRef<TeamsProfile>(defaultTeamsProfile);
  const [ready, setReady] = useState(false);
  const [teamsCtxReady, setTeamsCtxReady] = useState(false);
  const [profile, setProfile] = useState<TeamsProfile>(defaultTeamsProfile);
  const [clerkTimedOut, setClerkTimedOut] = useState(false);
  const [guestChosen, setGuestChosen] = useState(false);

  useEffect(() => {
    if (wasSignedInRef.current && !isSignedIn) {
      markTeamsManualAuth();
      setGuestChosen(false);
    }
    wasSignedInRef.current = isSignedIn;
  }, [isSignedIn]);

  useEffect(() => {
    if (isLoaded && signInLoaded) return;

    const timer = window.setTimeout(() => {
      console.warn('[teams-auth] Clerk did not load in time; continuing in guest mode.');
      setClerkTimedOut(true);
    }, CLERK_LOAD_TIMEOUT_MS);

    return () => window.clearTimeout(timer);
  }, [isLoaded, signInLoaded]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const ctxProfile = await initTeamsClient();
      if (cancelled) return;
      teamsCtxRef.current = { ...defaultTeamsProfile, ...ctxProfile };
      setProfile(teamsCtxRef.current);
      setTeamsCtxReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!teamsCtxReady) return;

    const clerkReady = isLoaded && signInLoaded;
    if (!clerkReady && !clerkTimedOut) return;

    let cancelled = false;

    (async () => {
      let nextProfile: TeamsProfile = { ...teamsCtxRef.current };

      if (!clerkReady) {
        configureGuestAuth();
        if (!cancelled) {
          setProfile((prev) => ({ ...prev, signedInWithTeams: false, signedInEmail: null }));
          setReady(true);
        }
        return;
      }

      try {
        if (isSignedIn) {
          configureAuth(() => getTokenRef.current());
          await syncAuthenticatedUser(() => getTokenRef.current()).catch((err) => {
            console.warn('Failed to sync account with server:', err);
          });
          clearTeamsManualAuth();
          nextProfile = {
            ...nextProfile,
            signedInWithTeams: true,
            signedInEmail: null,
          };
        } else if (shouldSkipTeamsAutoSso()) {
          configureGuestAuth();
          nextProfile = {
            ...nextProfile,
            signedInWithTeams: false,
            signedInEmail: null,
          };
        } else {
          const ssoEnabled = await getTeamsSsoStatus();
          if (ssoEnabled && nextProfile.inTeams) {
            try {
              const teamsToken = await withTimeout(
                authentication.getAuthToken(),
                TEAMS_SSO_TOKEN_TIMEOUT_MS,
                'Teams SSO token',
              );
              const { signInToken, email, displayName } = await exchangeTeamsSsoToken(teamsToken);

              const signInClient = signInRef.current;
              const activate = setActiveRef.current;
              if (!signInClient) {
                throw new Error('Clerk sign-in is unavailable.');
              }

              const attempt = await signInClient.create({ strategy: 'ticket', ticket: signInToken });
              if (attempt.status !== 'complete' || !attempt.createdSessionId) {
                throw new Error('Clerk sign-in did not complete.');
              }

              await activate!({ session: attempt.createdSessionId });
              configureAuth(() => getTokenRef.current());
              await syncAuthenticatedUser(() => getTokenRef.current()).catch((err) => {
                console.warn('Failed to sync account with server:', err);
              });

              markLandingHelpHint();
              nextProfile = {
                ...nextProfile,
                displayName: displayName ?? nextProfile.displayName,
                signedInWithTeams: true,
                signedInEmail: email,
              };
            } catch (err) {
              console.warn('Teams SSO unavailable, using guest mode:', err);
              configureGuestAuth();
              nextProfile = {
                ...nextProfile,
                signedInWithTeams: false,
                signedInEmail: null,
              };
            }
          } else {
            configureGuestAuth();
            nextProfile = {
              ...nextProfile,
              signedInWithTeams: false,
              signedInEmail: null,
            };
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
          setProfile((prev) => ({ ...prev, signedInWithTeams: false, signedInEmail: null }));
          setReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [teamsCtxReady, isLoaded, signInLoaded, clerkTimedOut, isSignedIn]);

  if (!ready) {
    return (
      <LoadingScreen
        detail={
          clerkTimedOut
            ? 'Authentication is taking longer than expected…'
            : undefined
        }
      />
    );
  }

  const showManualSignIn = !isSignedIn && shouldSkipTeamsAutoSso() && !guestChosen;

  if (showManualSignIn) {
    return (
      <TeamsManualSignInScreen onContinueAsGuest={() => setGuestChosen(true)} />
    );
  }

  return <TeamsEmbedProvider profile={profile}>{children}</TeamsEmbedProvider>;
}
