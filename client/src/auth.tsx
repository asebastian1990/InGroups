import {
  AuthenticateWithRedirectCallback,
  ClerkProvider,
  SignIn,
  SignedIn,
  SignedOut,
  useAuth,
} from '@clerk/clerk-react';
import { useEffect, useState, type ReactNode } from 'react';
import { configureAuth, configureGuestAuth, isGuestMode, resetAuth } from './api';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

/** Clerk OAuth must use absolute app URLs — relative "/" sends failures to Account Portal. */
function getAppUrls() {
  const origin = window.location.origin;
  return {
    root: `${origin}/`,
    origin,
  };
}

const signInAppearance = {
  elements: {
    rootBox: { width: '100%', maxWidth: '100%' },
    cardBox: { width: '100%', maxWidth: '100%' },
    card: { width: '100%', maxWidth: '100%' },
  },
};

function LoadingScreen() {
  return (
    <div className="app">
      <main className="app-content auth-screen">
        <p className="muted">Loading…</p>
      </main>
    </div>
  );
}

function isOAuthCallback(): boolean {
  return window.location.hash.includes('sso-callback');
}

function isStuckAuthRoute(): boolean {
  const hash = window.location.hash;
  if (!hash || hash === '#/' || hash === '#') return false;
  if (isOAuthCallback()) return false;
  return hash.startsWith('#/');
}

function resetAuthScreen() {
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  window.location.reload();
}

function AuthGate({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [guestActive, setGuestActive] = useState(() => isGuestMode());

  useEffect(() => {
    if (guestActive) {
      configureGuestAuth();
      return;
    }
    if (!isLoaded) return;
    if (isSignedIn) {
      configureAuth(() => getToken());
    } else {
      resetAuth();
    }
  }, [guestActive, isLoaded, isSignedIn, getToken]);

  const continueAsGuest = () => {
    configureGuestAuth();
    setGuestActive(true);
  };

  if (guestActive) {
    return <>{children}</>;
  }

  if (!isLoaded) return <LoadingScreen />;

  const { root: appRoot } = getAppUrls();

  if (isOAuthCallback()) {
    return (
      <div className="app app--auth">
        <main className="app-content auth-screen">
          <AuthenticateWithRedirectCallback
            signInFallbackRedirectUrl={appRoot}
            signUpFallbackRedirectUrl={appRoot}
          />
        </main>
      </div>
    );
  }

  return (
    <>
      <SignedOut>
        <div className="app app--auth">
          <main className="app-content auth-screen">
            <div className="auth-clerk">
              <SignIn
                routing="hash"
                oauthFlow="redirect"
                appearance={signInAppearance}
                fallbackRedirectUrl={appRoot}
                signUpUrl={appRoot}
                signUpFallbackRedirectUrl={appRoot}
              />
            </div>
            {isStuckAuthRoute() && (
              <button type="button" className="auth-reset-link" onClick={resetAuthScreen}>
                ← Back to sign in
              </button>
            )}
            <div className="guest-auth">
              <button type="button" className="guest-link" onClick={continueAsGuest}>
                Continue as Guest
              </button>
              <p className="guest-note">
                Play free word sets only. Sign in for licenses and custom word sets.
              </p>
            </div>
          </main>
        </div>
      </SignedOut>
      <SignedIn>{children}</SignedIn>
    </>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  if (!publishableKey) {
    return (
      <div className="app">
        <main className="app-content">
          <p className="error-msg">Missing VITE_CLERK_PUBLISHABLE_KEY in environment.</p>
        </main>
      </div>
    );
  }

  const { root: appRoot, origin: appOrigin } = getAppUrls();

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl={appRoot}
      signUpUrl={appRoot}
      signInFallbackRedirectUrl={appRoot}
      signUpFallbackRedirectUrl={appRoot}
      afterSignOutUrl={appRoot}
      allowedRedirectOrigins={[appOrigin]}
    >
      <AuthGate>{children}</AuthGate>
    </ClerkProvider>
  );
}
