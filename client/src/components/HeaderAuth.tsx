import { UserButton, useAuth } from '@clerk/clerk-react';
import { exitGuestMode, isGuestMode } from '../api';
import { useTeamsClerkUi, useTeamsEmbed } from '../teams/TeamsEmbedContext';
import { teamsHomeWithSignedOut } from '../teams/teamsManualAuth';

export function HeaderAuth() {
  const teamsEmbed = useTeamsEmbed();
  const teamsClerkUi = useTeamsClerkUi();
  const { isSignedIn } = useAuth();
  const afterSignOutUrl = teamsEmbed ? teamsHomeWithSignedOut() : '/sign-in';
  const showClerkAccount =
    !isGuestMode() && (isSignedIn || (teamsEmbed && teamsClerkUi));

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
