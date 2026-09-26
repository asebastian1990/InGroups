import { useAuth } from '@clerk/clerk-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  configureAuth,
  configureGuestAuth,
  getTeamsSsoStatus,
  isClerkAuthConfigured,
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
import {
  clearTeamsClerkLatch,
  latchTeamsClerkSession,
  readTeamsClerkLatch,
} from './teamsSessionLatch';
import { waitForClerkToken } from '../auth/waitForClerkToken';
import { runTeamsTicketSso } from './runTeamsTicketSso';
import {
  registerTeamsAuthLostHandler,
  registerTeamsAuthRecovery,
} from './teamsAuthRecovery';

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
  const initialLatch = readTeamsClerkLatch();
  const teamsSsoSessionRef = useRef<{ signedInEmail: string | null } | null>(
    initialLatch ? { signedInEmail: initialLatch.email } : null,
  );
  const readyLatchRef = useRef(false);
  const clerkUiEnabledRef = useRef(false);

  const markClerkUiEnabled = useCallback((email?: string | null) => {
    clerkUiEnabledRef.current = true;
    const latchedEmail =
      email !== undefined
        ? email
        : teamsSsoSessionRef.current?.signedInEmail ?? readTeamsClerkLatch()?.email ?? null;
    teamsSsoSessionRef.current = { signedInEmail: latchedEmail };
    latchTeamsClerkSession(latchedEmail);
    setClerkUiEnabled(true);
  }, []);

  const markClerkUiDisabled = useCallback(() => {
    clerkUiEnabledRef.current = false;
    setClerkUiEnabled(false);
    teamsSsoSessionRef.current = null;
    clerkSessionConfiguredRef.current = false;
    clearTeamsClerkLatch();
  }, []);

  const ensureClerkSessionConfigured = useCallback(async (waitForSession = false) => {
    const attempts = waitForSession ? 25 : 3;
    const delayMs = waitForSession ? 200 : 50;

    if (clerkSessionConfiguredRef.current && isClerkAuthConfigured()) {
      const valid = await waitForClerkToken(() => getTokenRef.current(), 2, 50);
      if (valid) return true;
      clerkSessionConfiguredRef.current = false;
    } else if (clerkSessionConfiguredRef.current) {
      clerkSessionConfiguredRef.current = false;
    }

    const token = await waitForClerkToken(() => getTokenRef.current(), attempts, delayMs);
    if (!token) return false;
    clerkSessionConfiguredRef.current = true;
    markClerkUiEnabled();
    configureAuth(() => getTokenRef.current());
    await syncAuthenticatedUser(() => getTokenRef.current()).catch((err) => {
      console.warn('Failed to sync account with server:', err);
    });
    clearTeamsManualAuth();
    return true;
  }, [markClerkUiEnabled]);

  const [ready, setReady] = useState(false);
  const [teamsCtxReady, setTeamsCtxReady] = useState(false);
  const [profile, setProfile] = useState<TeamsProfile>(defaultTeamsProfile);
  const [clerkTimedOut, setClerkTimedOut] = useState(false);
  const [guestChosen, setGuestChosen] = useState(false);
  const [clerkUiEnabled, setClerkUiEnabled] = useState(false);
  const [ssoPhase, setSsoPhase] = useState<'idle' | 'running' | 'done'>('idle');

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

  const beginSsoRetry = useCallback(() => {
    markClerkUiDisabled();
    readyLatchRef.current = false;
    setReady(false);
    setSsoPhase('running');
  }, [markClerkUiDisabled]);

  /** Wire Clerk token + API auth before showing signed-in Teams UI. */
  const completeSignedInTeams = useCallback(
    async (email: string | null, extras: Partial<TeamsProfile> = {}) => {
      const ok = await ensureClerkSessionConfigured(true);
      if (!ok) return false;
      markClerkUiEnabled(email);
      finishReady({
        ...teamsCtxRef.current,
        ...extras,
        signedInWithTeams: true,
        signedInEmail:
          extras.signedInEmail ??
          email ??
          teamsSsoSessionRef.current?.signedInEmail ??
          null,
      });
      setSsoPhase('done');
      return true;
    },
    [ensureClerkSessionConfigured, markClerkUiEnabled, finishReady],
  );

  useEffect(() => {
    if (shouldSkipTeamsAutoSso()) {
      markClerkUiDisabled();
    }
  }, [markClerkUiDisabled]);

  useEffect(() => {
    registerTeamsAuthRecovery(async () => {
      if (!clerkUiEnabledRef.current && !readTeamsClerkLatch()) {
        return false;
      }
      const result = await runTeamsTicketSso();
      if (!result.ok) return false;

      teamsSsoSessionRef.current = { signedInEmail: result.email };
      clerkSessionConfiguredRef.current = false;
      const token = await waitForClerkToken(() => getTokenRef.current(), 25, 200);
      if (!token) return false;

      clerkSessionConfiguredRef.current = true;
      markClerkUiEnabled(result.email);
      configureAuth(() => getTokenRef.current());
      await syncAuthenticatedUser(() => getTokenRef.current()).catch((err) => {
        console.warn('Failed to sync account with server:', err);
      });
      setProfile((prev) => ({
        ...prev,
        signedInWithTeams: true,
        signedInEmail: result.email ?? prev.signedInEmail,
        displayName: result.displayName ?? prev.displayName ?? teamsCtxRef.current.displayName,
      }));
      return true;
    });

    registerTeamsAuthLostHandler(() => {
      markClerkUiDisabled();
      setProfile((prev) => ({
        ...prev,
        signedInWithTeams: false,
        signedInEmail: null,
      }));
    });

    return () => {
      registerTeamsAuthRecovery(null);
      registerTeamsAuthLostHandler(null);
    };
  }, [markClerkUiEnabled, markClerkUiDisabled]);

  useEffect(() => {
    if (isLoaded) return;

    const timer = window.setTimeout(() => {
      console.warn('[teams-auth] Clerk did not load in time; continuing in guest mode.');
      setClerkTimedOut(true);
    }, CLERK_LOAD_TIMEOUT_MS);

    return () => window.clearTimeout(timer);
  }, [isLoaded]);

  useEffect(() => {
    if (!clerkTimedOut || readyLatchRef.current || !teamsCtxReady) return;

    const latched = readTeamsClerkLatch();
    const hasStoredSession =
      clerkUiEnabledRef.current || teamsSsoSessionRef.current || latched !== null;

    if (hasStoredSession) {
      if (!teamsSsoSessionRef.current && latched) {
        teamsSsoSessionRef.current = { signedInEmail: latched.email };
      }
      if (!isLoaded) {
        beginSsoRetry();
        return;
      }
      void completeSignedInTeams(latched?.email ?? null, {
        signedInEmail: teamsSsoSessionRef.current?.signedInEmail ?? latched?.email ?? null,
      }).then((ok) => {
        if (!ok && !shouldSkipTeamsAutoSso()) beginSsoRetry();
        else if (!ok) {
          configureGuestAuth();
          finishReady({ ...teamsCtxRef.current, signedInWithTeams: false, signedInEmail: null });
          setSsoPhase('done');
        }
      });
      return;
    }

    configureGuestAuth();
    finishReady({ ...teamsCtxRef.current, signedInWithTeams: false, signedInEmail: null });
    setSsoPhase('done');
  }, [
    clerkTimedOut,
    teamsCtxReady,
    isLoaded,
    finishReady,
    completeSignedInTeams,
    beginSsoRetry,
  ]);

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
    if (shouldSkipTeamsAutoSso()) return;

    const latched = readTeamsClerkLatch();
    const hasStoredSession =
      clerkUiEnabledRef.current || teamsSsoSessionRef.current || latched !== null;

    if (hasStoredSession) {
      if (readyLatchRef.current) return;

      if (!teamsSsoSessionRef.current && latched) {
        teamsSsoSessionRef.current = { signedInEmail: latched.email };
      }

      void completeSignedInTeams(latched?.email ?? null, {
        signedInEmail: teamsSsoSessionRef.current?.signedInEmail ?? latched?.email ?? null,
      }).then((ok) => {
        if (!ok && !shouldSkipTeamsAutoSso()) {
          console.warn('[teams-auth] Stored Teams session had no Clerk token; retrying SSO.');
          beginSsoRetry();
        }
      });
      return;
    }

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
  }, [
    teamsCtxReady,
    isLoaded,
    ssoPhase,
    finishReady,
    completeSignedInTeams,
    beginSsoRetry,
  ]);

  useEffect(() => {
    if (!teamsCtxReady || !isLoaded) return;
    if (!isSignedInRef.current) return;
    if (clerkUiEnabledRef.current) return;

    let cancelled = false;

    (async () => {
      teamsSsoSessionRef.current = { signedInEmail: null };
      const ok = await ensureClerkSessionConfigured(true);
      if (!cancelled && ok) {
        markClerkUiEnabled();
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

  /** Clerk isSignedIn often blips false in the Teams webview; keep API auth if the session latch is still valid. */
  useEffect(() => {
    if (!ready || !isLoaded || isSignedIn) return;
    const latched = readTeamsClerkLatch();
    if (!latched && !teamsSsoSessionRef.current) return;

    let cancelled = false;
    void (async () => {
      const ok = await ensureClerkSessionConfigured(true);
      if (cancelled || !ok) return;
      markClerkUiEnabled();
      setProfile((prev) => ({
        ...prev,
        signedInWithTeams: true,
        signedInEmail: prev.signedInEmail ?? teamsSsoSessionRef.current?.signedInEmail ?? null,
      }));
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, isLoaded, isSignedIn, ensureClerkSessionConfigured, markClerkUiEnabled]);

  useEffect(() => {
    if (!ready) return;

    const refreshClerkSession = () => {
      if (document.visibilityState !== 'visible') return;
      if (!clerkUiEnabledRef.current && !teamsSsoSessionRef.current && !readTeamsClerkLatch()) {
        return;
      }
      void ensureClerkSessionConfigured(true);
    };

    document.addEventListener('visibilitychange', refreshClerkSession);
    window.addEventListener('focus', refreshClerkSession);
    return () => {
      document.removeEventListener('visibilitychange', refreshClerkSession);
      window.removeEventListener('focus', refreshClerkSession);
    };
  }, [ready, ensureClerkSessionConfigured]);

  useEffect(() => {
    if (!ready || !clerkUiEnabled) return;

    const id = window.setInterval(() => {
      void ensureClerkSessionConfigured(true);
    }, 45_000);

    return () => window.clearInterval(id);
  }, [ready, clerkUiEnabled, ensureClerkSessionConfigured]);

  const handleSsoComplete = useCallback(
    (result: TeamsSsoResult) => {
      if (result.ok) {
        teamsSsoSessionRef.current = { signedInEmail: result.email };
        if (!helpHintMarkedRef.current) {
          helpHintMarkedRef.current = true;
          markLandingHelpHint();
        }
        void completeSignedInTeams(result.email, {
          displayName: result.displayName ?? teamsCtxRef.current.displayName,
          signedInEmail: result.email,
        }).then((ok) => {
          if (ok) return;
          setSsoPhase('done');
          configureGuestAuth();
          finishReady({ ...teamsCtxRef.current, signedInWithTeams: false, signedInEmail: null });
        });
        return;
      }

      setSsoPhase('done');
      configureGuestAuth();
      finishReady({ ...teamsCtxRef.current, signedInWithTeams: false, signedInEmail: null });
    },
    [completeSignedInTeams, finishReady],
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
