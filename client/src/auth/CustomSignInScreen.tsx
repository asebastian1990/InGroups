import { useSignIn } from '@clerk/clerk-react';
import { useCallback, useRef, useState, type FormEvent } from 'react';
import { useAuthFormIdleReset } from './useAuthFormIdleReset';
import { AuthFormHeader } from './AuthFormHeader';
import { formatClerkError } from './clerkErrors';
import { GoogleSignInButton } from './GoogleSignInButton';
import { APP_HOME, SIGN_UP_PATH, signInOAuthRedirectUrl } from './paths';
import { resendSignInEmailCode, sendSignInEmailCodeOnce } from './signInEmailCode';

type Step = 'form' | 'verify-code';

export function CustomSignInScreen() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const submittingRef = useRef(false);
  const [step, setStep] = useState<Step>('form');
  const [emailAddress, setEmailAddress] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [resent, setResent] = useState(false);

  const resetInteractionState = useCallback(() => {
    submittingRef.current = false;
    setBusy(false);
    setResendBusy(false);
  }, []);

  useAuthFormIdleReset(resetInteractionState);

  async function completeSignIn() {
    if (!signIn || !setActive || signIn.status !== 'complete' || !signIn.createdSessionId) {
      throw new Error('Sign-in is not complete yet.');
    }
    await setActive({ session: signIn.createdSessionId });
    window.location.replace(APP_HOME);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isLoaded || !signIn || submittingRef.current) return;

    submittingRef.current = true;
    setBusy(true);
    setError('');
    setResent(false);

    try {
      await signIn.create({ identifier: emailAddress.trim() });
      await sendSignInEmailCodeOnce(signIn);
      setStep('verify-code');
    } catch (err) {
      setError(formatClerkError(err));
    } finally {
      submittingRef.current = false;
      setBusy(false);
    }
  }

  async function handleVerifyCode(event: FormEvent) {
    event.preventDefault();
    if (!isLoaded || !signIn || submittingRef.current) return;

    submittingRef.current = true;
    setBusy(true);
    setError('');

    try {
      await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code: verificationCode.trim(),
      });
      await completeSignIn();
    } catch (err) {
      setError(formatClerkError(err));
    } finally {
      submittingRef.current = false;
      setBusy(false);
    }
  }

  async function handleGoogleSignIn() {
    if (!isLoaded || !signIn || busy) return;

    setError('');

    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: signInOAuthRedirectUrl(),
        redirectUrlComplete: `${window.location.origin}${APP_HOME}`,
      });
    } catch (err) {
      setError(formatClerkError(err));
      resetInteractionState();
    }
  }

  async function handleResend() {
    if (!isLoaded || !signIn || resendBusy) return;

    setResendBusy(true);
    setError('');
    setResent(false);

    try {
      await resendSignInEmailCode(signIn);
      setResent(true);
    } catch (err) {
      setError(formatClerkError(err));
    } finally {
      setResendBusy(false);
    }
  }

  function handleRestart() {
    setStep('form');
    setVerificationCode('');
    setError('');
    setResent(false);
  }

  if (!isLoaded) {
    return <p className="muted">Loading…</p>;
  }

  if (step === 'verify-code') {
    return (
      <div className="auth-form">
        <h1 className="auth-form-title">Check your email</h1>
        <p className="auth-form-lead">
          Enter the verification code sent to <strong>{emailAddress.trim()}</strong>.
        </p>
        <form className="auth-form-fields" onSubmit={handleVerifyCode}>
          <label className="input-label" htmlFor="sign-in-code">
            Verification code
          </label>
          <input
            id="sign-in-code"
            className="input"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={verificationCode}
            onChange={(event) => setVerificationCode(event.target.value)}
            required
          />
          {error && <p className="error-msg">{error}</p>}
          {resent && <p className="auth-form-note">A new code has been sent.</p>}
          <button type="submit" className="btn btn-primary auth-form-submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Continue'}
          </button>
        </form>
        <div className="auth-form-actions">
          <button type="button" className="btn" onClick={handleResend} disabled={resendBusy}>
            {resendBusy ? 'Sending…' : 'Resend code'}
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
      <AuthFormHeader title="Sign in to InGroups" />

      <GoogleSignInButton disabled={busy} onClick={handleGoogleSignIn} />

      <div className="auth-divider">
        <span>or</span>
      </div>

      <form className="auth-form-fields" onSubmit={handleSubmit}>
        <label className="input-label" htmlFor="sign-in-email">
          Email address
        </label>
        <input
          id="sign-in-email"
          className="input"
          type="email"
          autoComplete="email"
          value={emailAddress}
          onChange={(event) => setEmailAddress(event.target.value)}
          required
        />

        {error && <p className="error-msg">{error}</p>}

        <button type="submit" className="btn btn-primary auth-form-submit" disabled={busy}>
          {busy ? 'Continuing…' : 'Continue'}
        </button>
      </form>

      <p className="auth-form-footer">
        Need an account?{' '}
        <a className="auth-footer-link" href={SIGN_UP_PATH}>
          Create account
        </a>
      </p>

      <div id="clerk-captcha" />
    </div>
  );
}
