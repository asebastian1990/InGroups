import { UserButton } from '@clerk/clerk-react';
import { exitGuestMode, isGuestMode } from '../api';
import { useTeamsEmbed } from '../teams/TeamsEmbedContext';
import { teamsHomeWithSignedOut } from '../teams/teamsManualAuth';

export function HeaderAuth() {
  const teamsEmbed = useTeamsEmbed();
  const afterSignOutUrl = teamsEmbed ? teamsHomeWithSignedOut() : '/sign-in';
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

  return <UserButton afterSignOutUrl={afterSignOutUrl} />;
}
