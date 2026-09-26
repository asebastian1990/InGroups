export const SIGN_IN_PATH = '/sign-in';
export const SIGN_UP_PATH = '/sign-up';
export const SIGN_UP_VERIFY_PATH = '/sign-up/verify';
export const APP_HOME = '/';

export function normalizePath(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/';
}

export function isSsoCallbackPath(pathname = window.location.pathname): boolean {
  return pathname.includes('/sso-callback');
}

export function isSignInPath(pathname = window.location.pathname): boolean {
  return normalizePath(pathname) === SIGN_IN_PATH;
}

export function isSignUpVerifyPath(pathname = window.location.pathname): boolean {
  return normalizePath(pathname).startsWith(SIGN_UP_VERIFY_PATH);
}

export function isSignUpFormPath(pathname = window.location.pathname): boolean {
  return normalizePath(pathname) === SIGN_UP_PATH;
}

export function isAuthPath(pathname = window.location.pathname): boolean {
  return (
    isSignInPath(pathname) ||
    isSignUpFormPath(pathname) ||
    isSignUpVerifyPath(pathname) ||
    isSsoCallbackPath(pathname)
  );
}

export function emailLinkRedirectUrl(): string {
  return `${window.location.origin}${SIGN_UP_VERIFY_PATH}`;
}

export function signUpOAuthRedirectUrl(): string {
  return `${window.location.origin}${SIGN_UP_PATH}/sso-callback`;
}

export function signInOAuthRedirectUrl(): string {
  return `${window.location.origin}${SIGN_IN_PATH}/sso-callback`;
}
