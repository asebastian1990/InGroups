import { useClerk } from '@clerk/clerk-react';
import { EmailLinkErrorCode, isEmailLinkError } from '@clerk/clerk-react/errors';
import { useEffect, useRef, useState } from 'react';
import { formatClerkError } from './clerkErrors';
import { markLandingHelpHint } from './landingHelpHint';
import { APP_HOME, SIGN_UP_PATH, emailLinkRedirectUrl } from './paths';

type VerifyState = 'loading' | 'success' | 'error';

export function SignUpVerifyScreen() {
  const { handleEmailLinkVerification } = useClerk();
  const startedRef = useRef(false);
  const [state, setState] = useState<VerifyState>('loading');
  const [message, setMessage] = useState('Verifying your email…');

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    handleEmailLinkVerification({
      redirectUrl: emailLinkRedirectUrl(),
      redirectUrlComplete: `${window.location.origin}${APP_HOME}`,
    })
      .then(() => {
        markLandingHelpHint();
        setState('success');
        setMessage('Email verified. Redirecting…');
      })
      .catch((err: unknown) => {
        const error = err instanceof Error ? err : new Error(formatClerkError(err));
        if (isEmailLinkError(error)) {
          if (error.code === EmailLinkErrorCode.Expired) {
            setMessage('This sign-up link has expired.');
          } else if (error.code === EmailLinkErrorCode.ClientMismatch) {
            setMessage('Open the link on the same device and browser where you started sign-up.');
          } else {
            setMessage(formatClerkError(error));
          }
        } else {
          setMessage(formatClerkError(error));
        }
        setState('error');
      });
  }, [handleEmailLinkVerification]);

  return (
    <div className="auth-form">
      <h1 className="auth-form-title">Verify email</h1>
      <p className={state === 'error' ? 'error-msg' : 'auth-form-lead'}>{message}</p>
      {state === 'error' && (
        <p className="auth-form-footer">
          <a className="auth-footer-link" href={SIGN_UP_PATH}>
            Back to sign up
          </a>
        </p>
      )}
    </div>
  );
}
