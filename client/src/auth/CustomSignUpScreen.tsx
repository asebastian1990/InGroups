import { useSignUp } from '@clerk/clerk-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AuthFormHeader } from './AuthFormHeader';
import { formatClerkError } from './clerkErrors';
import { APP_HOME, SIGN_IN_PATH } from './paths';
import {
  preferredVerificationStrategy,
  resendSignUpVerification,
  sendSignUpVerificationOnce,
  type SignUpVerificationStrategy,
} from './signUpVerification';

type Step = 'form' | 'verify-code' | 'check-email';

export function CustomSignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const submittingRef = useRef(false);
  const [step, setStep] = useState<Step>('form');
  const [verificationStrategy, setVerificationStrategy] = useState<SignUpVerificationStrategy>('email_code');
  const [emailAddress, setEmailAddress] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
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

  async function completeSignUp() {
    if (!signUp || !setActive || signUp.status !== 'complete' || !signUp.createdSessionId) {
      throw new Error('Sign-up is not complete yet.');
    }
    await setActive({ session: signUp.createdSessionId });
    window.location.replace(APP_HOME);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isLoaded || !signUp || submittingRef.current) return;

    submittingRef.current = true;
    setBusy(true);
    setError('');
    setResent(false);

    try {
      await signUp.create({ emailAddress: emailAddress.trim() });
      const strategy = await sendSignUpVerificationOnce(signUp);
      setVerificationStrategy(strategy);
      setStep(strategy === 'email_link' ? 'check-email' : 'verify-code');
    } catch (err) {
      setError(formatClerkError(err));
    } finally {
      submittingRef.current = false;
      setBusy(false);
    }
  }

  async function handleVerifyCode(event: FormEvent) {
    event.preventDefault();
    if (!isLoaded || !signUp || submittingRef.current) return;

    submittingRef.current = true;
    setBusy(true);
    setError('');

    try {
      await signUp.attemptEmailAddressVerification({ code: verificationCode.trim() });
      await completeSignUp();
    } catch (err) {
      setError(formatClerkError(err));
    } finally {
      submittingRef.current = false;
      setBusy(false);
    }
  }

  async function handleResend() {
    if (!isLoaded || !signUp || resendBusy) return;

    setResendBusy(true);
    setError('');
    setResent(false);

    try {
      const strategy = verificationStrategy || preferredVerificationStrategy(signUp);
      await resendSignUpVerification(signUp, strategy);
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
          <label className="input-label" htmlFor="sign-up-code">
            Verification code
          </label>
          <input
            id="sign-up-code"
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
            {busy ? 'Verifying…' : 'Continue'}
          </button>
        </form>
        <div className="auth-form-actions">
          <button
            type="button"
            className="btn"
            onClick={handleResend}
            disabled={resendBusy}
          >
            {resendBusy ? 'Sending…' : 'Resend code'}
          </button>
          <button type="button" className="auth-reset-link" onClick={handleRestart}>
            Use a different email
          </button>
        </div>
      </div>
    );
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
      <AuthFormHeader title="Create account" />

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

        {error && <p className="error-msg">{error}</p>}

        <button type="submit" className="btn btn-primary auth-form-submit" disabled={busy}>
          {busy ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="auth-form-footer">
        Sign up with email or{' '}
        <a className="auth-footer-link" href={SIGN_IN_PATH}>
          sign in another way
        </a>
      </p>

      <div id="clerk-captcha" />
    </div>
  );
}
