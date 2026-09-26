import { UserButton } from '@clerk/clerk-react';
import { exitGuestMode, isGuestMode } from '../api';
import { useTeamsEmbed } from '../teams/TeamsEmbedContext';

export function HeaderAuth() {
  const teamsEmbed = useTeamsEmbed();
  const afterSignOutUrl = teamsEmbed ? '/teams' : '/sign-in';
  if (isGuestMode()) {
    return (
      <button
        type="button"
        className="sign-in-btn"
        onClick={() => {
          exitGuestMode();
          window.location.href = '/sign-in';
        }}
      >
        Exit
      </button>
    );
  }

  return <UserButton afterSignOutUrl={afterSignOutUrl} />;
}
