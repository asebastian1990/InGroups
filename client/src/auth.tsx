import {
  AuthenticateWithRedirectCallback,
  ClerkProvider,
  SignIn,
  SignedIn,
  SignedOut,
  useAuth,
} from '@clerk/clerk-react';
import { useEffect, type ReactNode } from 'react';
import { configureAuth, resetAuth } from './api';

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

function AuthTokenBridge({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      configureAuth(() => getToken());
    } else {
      resetAuth();
    }
  }, [isLoaded, isSignedIn, getToken]);

  return <>{children}</>;
}

function AuthGate({ children }: { children: ReactNode }) {
  const { isLoaded } = useAuth();

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
      <AuthTokenBridge>
        <AuthGate>{children}</AuthGate>
      </AuthTokenBridge>
    </ClerkProvider>
  );
}
