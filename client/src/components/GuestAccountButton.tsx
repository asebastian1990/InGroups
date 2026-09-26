import { exitGuestMode } from '../api';
import { useTeamsEmbed } from '../teams/TeamsEmbedContext';
import { teamsHomeWithSignedOut } from '../teams/teamsManualAuth';

/** Guest session: profile circle that only signs out (returns to sign-in). */
export function GuestAccountButton() {
  const teamsEmbed = useTeamsEmbed();

  return (
    <button
      type="button"
      className="account-circle-btn account-circle-btn--guest"
      aria-label="Sign out"
      title="Sign out"
      onClick={() => {
        exitGuestMode();
        window.location.href = teamsEmbed ? teamsHomeWithSignedOut() : '/sign-in';
      }}
    >
      G
    </button>
  );
}
