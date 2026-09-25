import { useSignUp } from '@clerk/clerk-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { formatClerkError } from './clerkErrors';
import { APP_HOME, SIGN_IN_PATH, signUpOAuthRedirectUrl } from './paths';
import { resendSignUpEmailLink, sendSignUpEmailLinkOnce } from './signUpEmailLink';

type Step = 'form' | 'check-email';

export function CustomSignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const submittingRef = useRef(false);
  const [step, setStep] = useState<Step>('form');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (step !== 'check-email' || !signUp || !setActive) return;

    let cancelled = false;
    const poll = window.setInterval(async () => {
      try {
        await signUp.reload();
        if (cancelled || signUp.status !== 'complete' || !signUp.createdSessionId) return;
        await setActive({ session: signUp.createdSessionId });
        window.location.replace(APP_HOME);
      } catch {
        // Keep polling until the user completes verification in another tab.
      }
    }, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
    };
  }, [step, signUp, setActive]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isLoaded || !signUp || submittingRef.current) return;

    submittingRef.current = true;
    setBusy(true);
    setError('');
    setResent(false);

    try {
      await signUp.create({ emailAddress: emailAddress.trim(), password });
      await sendSignUpEmailLinkOnce(signUp);
      setStep('check-email');
    } catch (err) {
      setError(formatClerkError(err));
    } finally {
      submittingRef.current = false;
      setBusy(false);
    }
  }

  async function handleGoogleSignUp() {
    if (!isLoaded || !signUp || busy) return;

    setBusy(true);
    setError('');

    try {
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: signUpOAuthRedirectUrl(),
        redirectUrlComplete: `${window.location.origin}${APP_HOME}`,
      });
    } catch (err) {
      setError(formatClerkError(err));
      setBusy(false);
    }
  }

  async function handleResend() {
    if (!isLoaded || !signUp || resendBusy) return;

    setResendBusy(true);
    setError('');
    setResent(false);

    try {
      await resendSignUpEmailLink(signUp);
      setResent(true);
    } catch (err) {
      setError(formatClerkError(err));
    } finally {
      setResendBusy(false);
    }
  }

  function handleRestart() {
    setStep('form');
    setError('');
    setResent(false);
  }

  if (!isLoaded) {
    return <p className="muted">Loading…</p>;
  }

  if (step === 'check-email') {
    return (
      <div className="auth-form">
        <h1 className="auth-form-title">Check your email</h1>
        <p className="auth-form-lead">
          We sent a sign-up link to <strong>{emailAddress.trim()}</strong>. Open it on this device to
          finish creating your account.
        </p>
        {error && <p className="error-msg">{error}</p>}
        {resent && <p className="auth-form-note">A new link has been sent.</p>}
        <div className="auth-form-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleResend}
            disabled={resendBusy}
          >
            {resendBusy ? 'Sending…' : 'Resend link'}
          </button>
          <button type="button" className="auth-reset-link" onClick={handleRestart}>
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-form">
      <h1 className="auth-form-title">Create account</h1>
      <p className="auth-form-lead">Sign up with email or continue with Google.</p>

      <form className="auth-form-fields" onSubmit={handleSubmit}>
        <label className="input-label" htmlFor="sign-up-email">
          Email address
        </label>
        <input
          id="sign-up-email"
          className="input"
          type="email"
          autoComplete="email"
          value={emailAddress}
          onChange={(event) => setEmailAddress(event.target.value)}
          required
        />

        <label className="input-label" htmlFor="sign-up-password">
          Password
        </label>
        <input
          id="sign-up-password"
          className="input"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        {error && <p className="error-msg">{error}</p>}

        <button type="submit" className="btn btn-primary auth-form-submit" disabled={busy}>
          {busy ? 'Continuing…' : 'Continue'}
        </button>
      </form>

      <div className="auth-divider">
        <span>or</span>
      </div>

      <button
        type="button"
        className="btn auth-oauth-btn"
        onClick={handleGoogleSignUp}
        disabled={busy}
      >
        Continue with Google
      </button>

      <p className="auth-form-footer">
        Already have an account?{' '}
        <a className="auth-footer-link" href={SIGN_IN_PATH}>
          Sign in
        </a>
      </p>

      <div id="clerk-captcha" />
    </div>
  );
}
