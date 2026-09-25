import type { useSignUp } from '@clerk/clerk-react';
import { emailLinkRedirectUrl } from './paths';

type SignUpResource = NonNullable<ReturnType<typeof useSignUp>['signUp']>;
export type SignUpVerificationStrategy = 'email_code' | 'email_link';

function emailVerificationAlreadyPrepared(signUp: SignUpResource): boolean {
  const status = signUp.verifications.emailAddress?.status;
  return status === 'unverified' || status === 'transferable';
}

export function preferredVerificationStrategy(signUp: SignUpResource): SignUpVerificationStrategy {
  const strategies = signUp.verifications.emailAddress?.supportedStrategies ?? [];
  if (strategies.includes('email_code')) return 'email_code';
  if (strategies.includes('email_link')) return 'email_link';
  return 'email_code';
}

/** Send at most one verification email after signUp.create(). */
export async function sendSignUpVerificationOnce(
  signUp: SignUpResource,
): Promise<SignUpVerificationStrategy> {
  const strategy = preferredVerificationStrategy(signUp);

  if (emailVerificationAlreadyPrepared(signUp)) {
    return strategy;
  }

  if (strategy === 'email_link') {
    await signUp.prepareEmailAddressVerification({
      strategy: 'email_link',
      redirectUrl: emailLinkRedirectUrl(),
    });
  } else {
    await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
  }

  return strategy;
}

export async function resendSignUpVerification(
  signUp: SignUpResource,
  strategy: SignUpVerificationStrategy,
): Promise<void> {
  if (strategy === 'email_link') {
    await signUp.prepareEmailAddressVerification({
      strategy: 'email_link',
      redirectUrl: emailLinkRedirectUrl(),
    });
    return;
  }

  await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
}
