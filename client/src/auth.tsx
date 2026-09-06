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
          <AuthenticateWithRedirectCallback />
        </main>
      </div>
    );
  }

  return (
    <>
      <SignedOut>
        <div className="app">
          <main className="app-content auth-screen">
            <SignIn routing="hash" />
            <div className="guest-auth">
              <button type="button" className="btn guest-btn" onClick={continueAsGuest}>
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
    <ClerkProvider publishableKey={publishableKey}>
      <AuthGate>{children}</AuthGate>
    </ClerkProvider>
  );
}
