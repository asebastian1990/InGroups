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
const APP_ROOT = '/';

const signInRedirectProps = {
  fallbackRedirectUrl: APP_ROOT,
  signUpUrl: APP_ROOT,
  signUpFallbackRedirectUrl: APP_ROOT,
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

  if (isOAuthCallback()) {
    return (
      <div className="app">
        <main className="app-content auth-screen">
          <AuthenticateWithRedirectCallback
            signInFallbackRedirectUrl={APP_ROOT}
            signUpFallbackRedirectUrl={APP_ROOT}
          />
        </main>
      </div>
    );
  }

  return (
    <>
      <SignedOut>
        <div className="app">
          <main className="app-content auth-screen">
            <div className="auth-clerk">
              <SignIn
                routing="hash"
                oauthFlow="popup"
                {...signInRedirectProps}
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

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl={APP_ROOT}
      signUpUrl={APP_ROOT}
      signInFallbackRedirectUrl={APP_ROOT}
      signUpFallbackRedirectUrl={APP_ROOT}
      afterSignOutUrl={APP_ROOT}
    >
      <AuthGate>{children}</AuthGate>
    </ClerkProvider>
  );
}
