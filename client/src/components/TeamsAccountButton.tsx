import { useClerk, useUser } from '@clerk/clerk-react';
import { SignOutUserButton } from './SignOutUserButton';
import { readTeamsClerkLatch } from '../teams/teamsSessionLatch';
import { teamsHomeWithSignedOut } from '../teams/teamsManualAuth';

/** Teams iframe: keep a visible account control when Clerk hooks flicker after clicks. */
export function TeamsAccountButton() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const latch = readTeamsClerkLatch();
  const afterSignOutUrl = teamsHomeWithSignedOut();

  if (isLoaded && user) {
    return <SignOutUserButton afterSignOutUrl={afterSignOutUrl} />;
  }

  if (!latch) {
    return null;
  }

  const label = latch.email?.split('@')[0] ?? 'Account';
  const initial = (label[0] ?? 'A').toUpperCase();

  return (
    <button
      type="button"
      className="account-circle-btn"
      aria-label="Account and sign out"
      title={latch.email ?? 'Signed in'}
      onClick={() => {
        void signOut().finally(() => {
          window.location.href = afterSignOutUrl;
        });
      }}
    >
      {initial}
    </button>
  );
}
