import { UserButton, useAuth } from '@clerk/clerk-react';
import { exitGuestMode, isGuestMode } from '../api';
import { useTeamsClerkUi, useTeamsEmbed, useTeamsProfile } from '../teams/TeamsEmbedContext';
import { teamsHomeWithSignedOut } from '../teams/teamsManualAuth';

export function HeaderAuth() {
  const teamsEmbed = useTeamsEmbed();
  const teamsClerkUi = useTeamsClerkUi();
  const teamsProfile = useTeamsProfile();
  const { isSignedIn, userId } = useAuth();
  const afterSignOutUrl = teamsEmbed ? teamsHomeWithSignedOut() : '/sign-in';
  const teamsHasClerkSession =
    teamsEmbed && (teamsClerkUi || teamsProfile.signedInWithTeams);
  const showClerkAccount =
    !isGuestMode() && (Boolean(isSignedIn || userId) || teamsHasClerkSession);

  if (isGuestMode()) {
    return (
      <button
        type="button"
        className="sign-in-btn"
        onClick={() => {
          exitGuestMode();
          window.location.href = teamsEmbed ? teamsHomeWithSignedOut() : '/sign-in';
        }}
      >
        Exit
      </button>
    );
  }

  if (!showClerkAccount) {
    return null;
  }

  return <UserButton afterSignOutUrl={afterSignOutUrl} />;
}
