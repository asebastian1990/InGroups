import { useAuth } from '@clerk/clerk-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  configureAuth,
  configureGuestAuth,
  getTeamsSsoStatus,
  resetAuth,
  syncAuthenticatedUser,
} from '../api';
import { markLandingHelpHint } from '../auth/landingHelpHint';
import { initTeamsClient } from './initTeams';
import { RunTeamsSsoOnce, type TeamsSsoResult } from './RunTeamsSsoOnce';
import { TeamsEmbedProvider } from './TeamsEmbedContext';
import { TeamsManualSignInScreen } from './TeamsManualSignInScreen';
import type { TeamsProfile } from './types';
import { defaultTeamsProfile } from './types';
import {
  clearTeamsManualAuth,
  consumeTeamsSignedOutFromUrl,
  shouldSkipTeamsAutoSso,
  TEAMS_HOME,
} from './teamsManualAuth';

const CLERK_LOAD_TIMEOUT_MS = 12_000;

let signedOutQueryConsumed = false;

function ensureSignedOutQueryConsumed() {
  if (signedOutQueryConsumed) return;
  signedOutQueryConsumed = true;
  consumeTeamsSignedOutFromUrl();
}

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
  ensureSignedOutQueryConsumed();

  const { isLoaded, isSignedIn, getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const isSignedInRef = useRef(isSignedIn);
  isSignedInRef.current = isSignedIn;

  const teamsCtxRef = useRef<TeamsProfile>(defaultTeamsProfile);
  const helpHintMarkedRef = useRef(false);
  const clerkSessionConfiguredRef = useRef(false);
  const teamsSsoSessionRef = useRef<{ signedInEmail: string | null } | null>(null);
  const readyLatchRef = useRef(false);
  const clerkUiEnabledRef = useRef(false);

  const ensureClerkSessionConfigured = useCallback(async () => {
    if (clerkSessionConfiguredRef.current) return true;
    try {
      const token = await getTokenRef.current();
      if (!token) return false;
    } catch {
      return false;
    }
    clerkSessionConfiguredRef.current = true;
    clerkUiEnabledRef.current = true;
    configureAuth(() => getTokenRef.current());
    await syncAuthenticatedUser(() => getTokenRef.current()).catch((err) => {
      console.warn('Failed to sync account with server:', err);
    });
    clearTeamsManualAuth();
    return true;
  }, []);

  const [ready, setReady] = useState(false);
  const [teamsCtxReady, setTeamsCtxReady] = useState(false);
  const [profile, setProfile] = useState<TeamsProfile>(defaultTeamsProfile);
  const [clerkTimedOut, setClerkTimedOut] = useState(false);
  const [guestChosen, setGuestChosen] = useState(false);
  const [clerkUiEnabled, setClerkUiEnabled] = useState(false);
  const [ssoPhase, setSsoPhase] = useState<'idle' | 'running' | 'done'>('idle');

  const markClerkUiEnabled = useCallback(() => {
    clerkUiEnabledRef.current = true;
    setClerkUiEnabled(true);
  }, []);

  const markClerkUiDisabled = useCallback(() => {
    clerkUiEnabledRef.current = false;
    setClerkUiEnabled(false);
    teamsSsoSessionRef.current = null;
    clerkSessionConfiguredRef.current = false;
  }, []);

  const finishReady = useCallback((nextProfile: TeamsProfile) => {
    setProfile((prev) => {
      if (clerkUiEnabledRef.current) {
        return {
          ...nextProfile,
          signedInWithTeams: true,
          signedInEmail:
            nextProfile.signedInEmail ??
            prev.signedInEmail ??
            teamsSsoSessionRef.current?.signedInEmail ??
            null,
        };
      }
      return nextProfile;
    });
    readyLatchRef.current = true;
    setReady(true);
  }, []);

  useEffect(() => {
    if (shouldSkipTeamsAutoSso()) {
      markClerkUiDisabled();
    }
  }, [markClerkUiDisabled]);

  useEffect(() => {
    if (isLoaded) return;

    const timer = window.setTimeout(() => {
      console.warn('[teams-auth] Clerk did not load in time; continuing in guest mode.');
      setClerkTimedOut(true);
    }, CLERK_LOAD_TIMEOUT_MS);

    return () => window.clearTimeout(timer);
  }, [isLoaded]);

  useEffect(() => {
    if (!clerkTimedOut || readyLatchRef.current || clerkUiEnabledRef.current) return;
    configureGuestAuth();
    finishReady({ ...teamsCtxRef.current, signedInWithTeams: false, signedInEmail: null });
    setSsoPhase('done');
  }, [clerkTimedOut, finishReady]);

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
    if (!teamsCtxReady || !isLoaded) return;
    if (clerkUiEnabledRef.current || teamsSsoSessionRef.current) return;
    if (shouldSkipTeamsAutoSso()) return;
    if (isSignedInRef.current) return;
    if (ssoPhase !== 'idle') return;

    let cancelled = false;

    (async () => {
      const ssoEnabled = await getTeamsSsoStatus();
      if (cancelled) return;
      if (!ssoEnabled || !teamsCtxRef.current.inTeams) {
        configureGuestAuth();
        finishReady({ ...teamsCtxRef.current, signedInWithTeams: false, signedInEmail: null });
        setSsoPhase('done');
        return;
      }
      setSsoPhase('running');
    })();

    return () => {
      cancelled = true;
    };
  }, [teamsCtxReady, isLoaded, ssoPhase, finishReady]);

  useEffect(() => {
    if (!teamsCtxReady || !isLoaded) return;
    if (!isSignedInRef.current) return;
    if (clerkUiEnabledRef.current) return;

    let cancelled = false;

    (async () => {
      teamsSsoSessionRef.current = { signedInEmail: null };
      if (await ensureClerkSessionConfigured()) {
        markClerkUiEnabled();
      }
      if (!cancelled) {
        finishReady({
          ...teamsCtxRef.current,
          signedInWithTeams: true,
          signedInEmail: null,
        });
        setSsoPhase('done');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [teamsCtxReady, isLoaded, isSignedIn, ensureClerkSessionConfigured, markClerkUiEnabled, finishReady]);

  useEffect(() => {
    if (!teamsCtxReady || !isLoaded) return;
    if (!shouldSkipTeamsAutoSso()) return;

    let nextProfile: TeamsProfile = { ...teamsCtxRef.current, signedInWithTeams: false, signedInEmail: null };
    if (guestChosen) {
      configureGuestAuth();
    } else {
      resetAuth();
    }
    finishReady(nextProfile);
    setSsoPhase('done');
  }, [teamsCtxReady, isLoaded, guestChosen, finishReady]);

  useEffect(() => {
    if (!ready || !isLoaded) return;
    if (!isSignedIn && !teamsSsoSessionRef.current) return;

    void ensureClerkSessionConfigured().then((ok) => {
      if (!ok) return;
      markClerkUiEnabled();
      setProfile((prev) => ({
        ...prev,
        signedInWithTeams: true,
        signedInEmail: prev.signedInEmail ?? teamsSsoSessionRef.current?.signedInEmail ?? null,
      }));
    });
  }, [ready, isLoaded, isSignedIn, ensureClerkSessionConfigured, markClerkUiEnabled]);

  const handleSsoComplete = useCallback(
    async (result: TeamsSsoResult) => {
      setSsoPhase('done');

      if (result.ok) {
        teamsSsoSessionRef.current = { signedInEmail: result.email };
        if (await ensureClerkSessionConfigured()) {
          markClerkUiEnabled();
        }
        if (!helpHintMarkedRef.current) {
          helpHintMarkedRef.current = true;
          markLandingHelpHint();
        }
        finishReady({
          ...teamsCtxRef.current,
          displayName: result.displayName ?? teamsCtxRef.current.displayName,
          signedInWithTeams: true,
          signedInEmail: result.email,
        });
        return;
      }

      configureGuestAuth();
      finishReady({ ...teamsCtxRef.current, signedInWithTeams: false, signedInEmail: null });
    },
    [ensureClerkSessionConfigured, markClerkUiEnabled, finishReady],
  );

  const retryTeamsSso = () => {
    clearTeamsManualAuth();
    setGuestChosen(false);
    markClerkUiDisabled();
    setSsoPhase('idle');
    setReady(false);
    readyLatchRef.current = false;
    window.location.replace(TEAMS_HOME);
  };

  if (!ready && !readyLatchRef.current) {
    return (
      <>
        {ssoPhase === 'running' && <RunTeamsSsoOnce onComplete={handleSsoComplete} />}
        <LoadingScreen
          detail={
            clerkTimedOut
              ? 'Authentication is taking longer than expected…'
              : undefined
          }
        />
      </>
    );
  }

  const showManualSignIn =
    shouldSkipTeamsAutoSso() && !guestChosen && !clerkUiEnabled;

  if (showManualSignIn) {
    return (
      <TeamsManualSignInScreen
        onContinueAsGuest={() => setGuestChosen(true)}
        onRetryTeamsSso={retryTeamsSso}
      />
    );
  }

  return (
    <TeamsEmbedProvider profile={profile} clerkUiEnabled={clerkUiEnabled}>
      {children}
    </TeamsEmbedProvider>
  );
}
