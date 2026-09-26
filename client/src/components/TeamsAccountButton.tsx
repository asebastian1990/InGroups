import { SignOutUserButton } from './SignOutUserButton';
import { useTeamsClerkUi } from '../teams/TeamsEmbedContext';
import { readTeamsClerkLatch } from '../teams/teamsSessionLatch';
import { teamsHomeWithSignedOut } from '../teams/teamsManualAuth';

/**
 * Teams iframe: always keep Clerk UserButton mounted once SSO succeeded.
 * Do not swap to a fallback when useAuth().isSignedIn flickers — unmounting UserButton makes it worse.
 */
export function TeamsAccountButton() {
  const teamsClerkUi = useTeamsClerkUi();
  const latch = readTeamsClerkLatch();

  if (!teamsClerkUi && latch === null) {
    return null;
  }

  return <SignOutUserButton afterSignOutUrl={teamsHomeWithSignedOut()} />;
}
