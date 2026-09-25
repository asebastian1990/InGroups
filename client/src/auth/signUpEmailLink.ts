import type { useSignUp } from '@clerk/clerk-react';
import { emailLinkRedirectUrl } from './paths';

type SignUpResource = NonNullable<ReturnType<typeof useSignUp>['signUp']>;

function emailLinkAlreadyPrepared(signUp: SignUpResource): boolean {
  const status = signUp.verifications.emailAddress?.status;
  return status === 'unverified' || status === 'transferable';
}

/** Send at most one verification email after signUp.create(). */
export async function sendSignUpEmailLinkOnce(signUp: SignUpResource): Promise<void> {
  if (emailLinkAlreadyPrepared(signUp)) {
    return;
  }

  await signUp.prepareEmailAddressVerification({
    strategy: 'email_link',
    redirectUrl: emailLinkRedirectUrl(),
  });
}

export async function resendSignUpEmailLink(signUp: SignUpResource): Promise<void> {
  await signUp.prepareEmailAddressVerification({
    strategy: 'email_link',
    redirectUrl: emailLinkRedirectUrl(),
  });
}
