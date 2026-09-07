import {
  AuthenticateWithRedirectCallback,
  ClerkProvider,
  SignIn,
  useAuth,
} from '@clerk/clerk-react';
import { useEffect, useState, type ReactNode } from 'react';
import { configureAuth, configureGuestAuth, isGuestMode, resetAuth } from './api';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const SIGN_IN_PATH = '/sign-in';
const APP_HOME = '/';

const signInAppearance = {
  elements: {
    rootBox: { width: '100%', maxWidth: '100%' },
    cardBox: { width: '100%', maxWidth: '100%' },
    card: { width: '100%', maxWidth: '100%' },
  },
};

function LoadingScreen() {
  return (
    <div className="app app--auth">
      <main className="app-content auth-screen">
        <p className="muted">Loading…</p>
      </main>
    </div>
  );
}

function isSsoCallbackPath(): boolean {
  return window.location.pathname.includes('/sso-callback');
}

function isSignInPath(): boolean {
  return window.location.pathname.startsWith(SIGN_IN_PATH);
}

function SignInScreen({ onContinueAsGuest }: { onContinueAsGuest: () => void }) {
  return (
    <div className="app app--auth">
      <main className="app-content auth-screen">
        <div className="auth-clerk">
          <SignIn
            routing="path"
            path={SIGN_IN_PATH}
            oauthFlow="redirect"
            appearance={signInAppearance}
            signInUrl={SIGN_IN_PATH}
            signUpUrl={SIGN_IN_PATH}
            fallbackRedirectUrl={APP_HOME}
            signUpFallbackRedirectUrl={APP_HOME}
          />
        </div>
        <div className="guest-auth">
          <button type="button" className="guest-link" onClick={onContinueAsGuest}>
            Continue as Guest
          </button>
          <p className="guest-note">
            Play free word sets only. Sign in for licenses and custom word sets.
          </p>
        </div>
      </main>
    </div>
  );
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

  useEffect(() => {
    if (guestActive || !isLoaded || isSignedIn) return;
    if (isSignInPath() || isSsoCallbackPath()) return;
    window.location.replace(SIGN_IN_PATH);
  }, [guestActive, isLoaded, isSignedIn]);

  const continueAsGuest = () => {
    configureGuestAuth();
    setGuestActive(true);
    if (isSignInPath()) {
      window.history.replaceState(null, '', APP_HOME);
    }
  };

  if (guestActive) {
    return <>{children}</>;
  }

  if (!isLoaded) return <LoadingScreen />;

  if (isSsoCallbackPath()) {
    return (
      <div className="app app--auth">
        <main className="app-content auth-screen">
          <AuthenticateWithRedirectCallback
            signInUrl={SIGN_IN_PATH}
            signUpUrl={SIGN_IN_PATH}
            signInFallbackRedirectUrl={APP_HOME}
            signUpFallbackRedirectUrl={APP_HOME}
          />
        </main>
      </div>
    );
  }

  if (isSignedIn) {
    return <>{children}</>;
  }

  if (!isSignInPath()) {
    return <LoadingScreen />;
  }

  return <SignInScreen onContinueAsGuest={continueAsGuest} />;
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

  const appOrigin = window.location.origin;

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl={SIGN_IN_PATH}
      signUpUrl={SIGN_IN_PATH}
      signInFallbackRedirectUrl={APP_HOME}
      signUpFallbackRedirectUrl={APP_HOME}
      afterSignOutUrl={SIGN_IN_PATH}
      allowedRedirectOrigins={[appOrigin]}
    >
      <AuthGate>{children}</AuthGate>
    </ClerkProvider>
  );
}
