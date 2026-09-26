import type { useSignIn } from '@clerk/clerk-react';

type SignInResource = NonNullable<ReturnType<typeof useSignIn>['signIn']>;

function signInEmailCodeAlreadyPrepared(signIn: SignInResource): boolean {
  const status = signIn.firstFactorVerification?.status;
  return status === 'unverified' || status === 'transferable';
}

function getEmailCodeFactor(signIn: SignInResource) {
  return signIn.supportedFirstFactors?.find((factor) => factor.strategy === 'email_code');
}

/** Send at most one verification email after signIn.create(). */
export async function sendSignInEmailCodeOnce(signIn: SignInResource): Promise<void> {
  if (signInEmailCodeAlreadyPrepared(signIn)) {
    return;
  }

  const emailCodeFactor = getEmailCodeFactor(signIn);
  if (!emailCodeFactor || emailCodeFactor.strategy !== 'email_code') {
    throw new Error('Email code sign-in is not available for this account.');
  }

  await signIn.prepareFirstFactor({
    strategy: 'email_code',
    emailAddressId: emailCodeFactor.emailAddressId,
  });
}

export async function resendSignInEmailCode(signIn: SignInResource): Promise<void> {
  const emailCodeFactor = getEmailCodeFactor(signIn);
  if (!emailCodeFactor || emailCodeFactor.strategy !== 'email_code') {
    throw new Error('Email code sign-in is not available for this account.');
  }

  await signIn.prepareFirstFactor({
    strategy: 'email_code',
    emailAddressId: emailCodeFactor.emailAddressId,
  });
}
