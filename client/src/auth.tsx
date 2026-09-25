import {
  AuthenticateWithRedirectCallback,
  ClerkProvider,
  SignIn,
  SignUp,
  useAuth,
} from '@clerk/clerk-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  configureAuth,
  configureGuestAuth,
  isGuestMode,
  resetAuth,
  syncAuthenticatedUser,
} from './api';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const SIGN_IN_PATH = '/sign-in';
const SIGN_UP_PATH = '/sign-up';
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

function isSignUpPath(): boolean {
  return window.location.pathname.startsWith(SIGN_UP_PATH);
}

function isAuthPath(): boolean {
  return isSignInPath() || isSignUpPath() || isSsoCallbackPath();
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
            signUpUrl={SIGN_UP_PATH}
            fallbackRedirectUrl={APP_HOME}
            signUpFallbackRedirectUrl={APP_HOME}
          />
        </div>
        <div className="guest-auth">
          <button type="button" className="btn" onClick={onContinueAsGuest}>
            Continue as Guest
          </button>
        </div>
      </main>
    </div>
  );
}

function SignUpScreen({ onContinueAsGuest }: { onContinueAsGuest: () => void }) {
  return (
    <div className="app app--auth">
      <main className="app-content auth-screen">
        <div className="auth-clerk">
          <SignUp
            routing="path"
            path={SIGN_UP_PATH}
            oauthFlow="redirect"
            appearance={signInAppearance}
            signInUrl={SIGN_IN_PATH}
            fallbackRedirectUrl={APP_HOME}
            signInFallbackRedirectUrl={APP_HOME}
          />
        </div>
        <div className="guest-auth">
          <button type="button" className="btn" onClick={onContinueAsGuest}>
            Continue as Guest
          </button>
        </div>
      </main>
    </div>
  );
}

function AuthGate({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const wasSignedInRef = useRef(isSignedIn);
  const [guestActive, setGuestActive] = useState(() => isGuestMode());

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.debug('[auth]', {
        isLoaded,
        isSignedIn,
        path: window.location.pathname,
      });
    }
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (guestActive) {
      configureGuestAuth();
      return;
    }
    if (!isLoaded) return;

    if (isSignedIn) {
      configureAuth(() => getTokenRef.current());
      syncAuthenticatedUser(() => getTokenRef.current()).catch((err) => {
        console.warn('Failed to sync account with server:', err);
      });
    } else if (wasSignedInRef.current) {
      resetAuth();
    }

    wasSignedInRef.current = isSignedIn;
  }, [guestActive, isLoaded, isSignedIn]);

  useEffect(() => {
    if (guestActive || !isLoaded || isSignedIn) return;
    if (isAuthPath()) return;
    window.location.replace(SIGN_IN_PATH);
  }, [guestActive, isLoaded, isSignedIn]);

  const continueAsGuest = () => {
    configureGuestAuth();
    setGuestActive(true);
    if (isSignInPath() || isSignUpPath()) {
      window.history.replaceState(null, '', APP_HOME);
    }
  };

  if (guestActive) {
    return <>{children}</>;
  }

  if (isSignedIn) {
    if (!isLoaded) return <LoadingScreen />;
    return <>{children}</>;
  }

  if (isSsoCallbackPath()) {
    return (
      <div className="app app--auth">
        <main className="app-content auth-screen">
          <AuthenticateWithRedirectCallback
            signInUrl={SIGN_IN_PATH}
            signUpUrl={SIGN_UP_PATH}
            signInFallbackRedirectUrl={APP_HOME}
            signUpFallbackRedirectUrl={APP_HOME}
          />
        </main>
      </div>
    );
  }

  // Keep Clerk sign-in/up mounted on auth routes. Swapping to LoadingScreen while
  // Clerk revalidates remounts <SignUp>/<SignIn> and can resend verification codes.
  if (isSignUpPath()) {
    return <SignUpScreen onContinueAsGuest={continueAsGuest} />;
  }

  if (isSignInPath()) {
    return <SignInScreen onContinueAsGuest={continueAsGuest} />;
  }

  if (!isLoaded) return <LoadingScreen />;

  return <LoadingScreen />;
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
      signUpUrl={SIGN_UP_PATH}
      signInFallbackRedirectUrl={APP_HOME}
      signUpFallbackRedirectUrl={APP_HOME}
      afterSignOutUrl={SIGN_IN_PATH}
      allowedRedirectOrigins={[appOrigin]}
    >
      <AuthGate>{children}</AuthGate>
    </ClerkProvider>
  );
}
