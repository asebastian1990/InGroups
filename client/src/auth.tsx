import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  configureAuth,
  configureGuestAuth,
  isGuestMode,
  resetAuth,
  syncAuthenticatedUser,
} from './api';
import { CustomSignInScreen } from './auth/CustomSignInScreen';
import { CustomSignUpScreen } from './auth/CustomSignUpScreen';
import { SignUpVerifyScreen } from './auth/SignUpVerifyScreen';
import {
  APP_HOME,
  SIGN_IN_PATH,
  SIGN_UP_PATH,
  isAuthPath,
  isSignInPath,
  isSignUpFormPath,
  isSignUpVerifyPath,
  isSsoCallbackPath,
} from './auth/paths';
import { markLandingHelpHint } from './auth/landingHelpHint';
import { SsoRedirectCallback } from './auth/SsoRedirectCallback';
import { useWindowPathname } from './auth/useWindowPathname';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function LoadingScreen() {
  return (
    <div className="app app--auth">
      <main className="app-content auth-screen">
        <p className="muted">Loading…</p>
      </main>
    </div>
  );
}

function AuthScreenLayout({
  children,
  onContinueAsGuest,
  showGuest = true,
}: {
  children: ReactNode;
  onContinueAsGuest: () => void;
  showGuest?: boolean;
}) {
  return (
    <div className="app app--auth">
      <main className="app-content auth-screen">
        <div className="auth-clerk">{children}</div>
        {showGuest && (
          <div className="guest-auth">
            <button type="button" className="btn" onClick={onContinueAsGuest}>
              Continue as Guest
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function SignInScreen({ onContinueAsGuest }: { onContinueAsGuest: () => void }) {
  return (
    <AuthScreenLayout onContinueAsGuest={onContinueAsGuest}>
      <CustomSignInScreen />
    </AuthScreenLayout>
  );
}

function SignUpScreen({ onContinueAsGuest }: { onContinueAsGuest: () => void }) {
  return (
    <AuthScreenLayout onContinueAsGuest={onContinueAsGuest} showGuest={false}>
      <CustomSignUpScreen />
    </AuthScreenLayout>
  );
}

function SignUpVerifyPage({ onContinueAsGuest }: { onContinueAsGuest: () => void }) {
  return (
    <AuthScreenLayout onContinueAsGuest={onContinueAsGuest}>
      <SignUpVerifyScreen />
    </AuthScreenLayout>
  );
}

function AuthGate({ children }: { children: ReactNode }) {
  const pathname = useWindowPathname();
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
    if (isAuthPath(pathname)) return;
    window.location.replace(SIGN_IN_PATH);
  }, [guestActive, isLoaded, isSignedIn, pathname]);

  const continueAsGuest = () => {
    configureGuestAuth();
    setGuestActive(true);
    if (isSignInPath(pathname) || isSignUpFormPath(pathname) || isSignUpVerifyPath(pathname)) {
      markLandingHelpHint();
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

  if (isSsoCallbackPath(pathname)) {
    return (
      <div className="app app--auth">
        <main className="app-content auth-screen">
          <p className="muted">Completing sign-in…</p>
          <SsoRedirectCallback />
        </main>
      </div>
    );
  }

  // Keep auth screens mounted on auth routes. Swapping to LoadingScreen while Clerk
  // revalidates can remount sign-up/sign-in UI and resend verification emails.
  if (isSignUpVerifyPath(pathname)) {
    return <SignUpVerifyPage onContinueAsGuest={continueAsGuest} />;
  }

  if (isSignUpFormPath(pathname)) {
    return <SignUpScreen onContinueAsGuest={continueAsGuest} />;
  }

  if (isSignInPath(pathname)) {
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
