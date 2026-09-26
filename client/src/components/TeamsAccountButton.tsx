import { useAuth } from '@clerk/clerk-react';
import { SignOutUserButton } from './SignOutUserButton';
import { useTeamsClerkUi } from '../teams/TeamsEmbedContext';
import { readTeamsClerkLatch } from '../teams/teamsSessionLatch';
import { teamsHomeWithSignedOut } from '../teams/teamsManualAuth';

/** Teams iframe: keep Clerk UserButton when hooks flicker after clicks or tab focus changes. */
export function TeamsAccountButton() {
  const teamsClerkUi = useTeamsClerkUi();
  const latch = readTeamsClerkLatch();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const afterSignOutUrl = teamsHomeWithSignedOut();

  const preferClerkButton =
    teamsClerkUi ||
    latch !== null ||
    (authLoaded && isSignedIn);

  if (!preferClerkButton) {
    return null;
  }

  return <SignOutUserButton afterSignOutUrl={afterSignOutUrl} />;
}
