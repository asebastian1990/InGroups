import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { APP_HOME, SIGN_IN_PATH, SIGN_UP_PATH } from './paths';

const SSO_CALLBACK_TIMEOUT_MS = 12_000;

/**
 * Completes OAuth redirect; if Clerk does not navigate away (e.g. user cancelled),
 * send the user back to sign-in with a full navigation so form state is fresh.
 */
export function SsoRedirectCallback() {
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (window.location.pathname.includes('/sso-callback')) {
        window.location.replace(SIGN_IN_PATH);
      }
    }, SSO_CALLBACK_TIMEOUT_MS);

    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <AuthenticateWithRedirectCallback
      signInUrl={SIGN_IN_PATH}
      signUpUrl={SIGN_UP_PATH}
      signInFallbackRedirectUrl={APP_HOME}
      signUpFallbackRedirectUrl={APP_HOME}
    />
  );
}
