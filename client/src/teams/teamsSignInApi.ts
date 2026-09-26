import type { useSignIn } from '@clerk/clerk-react';

type SignInLoaded = NonNullable<ReturnType<typeof useSignIn>['signIn']>;
type SetActiveFn = NonNullable<ReturnType<typeof useSignIn>['setActive']>;

export type TeamsSignInApi = {
  signIn: SignInLoaded;
  setActive: SetActiveFn;
};

let api: TeamsSignInApi | null = null;

export function setTeamsSignInApi(next: TeamsSignInApi | null) {
  api = next;
}

export function getTeamsSignInApi(): TeamsSignInApi | null {
  return api;
}
