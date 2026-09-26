import { isGuestMode } from '../api';
import { GuestAccountButton } from './GuestAccountButton';
import { SignOutUserButton } from './SignOutUserButton';
import { TeamsAccountButton } from './TeamsAccountButton';
import { useTeamsEmbed } from '../teams/TeamsEmbedContext';
import { teamsHomeWithSignedOut } from '../teams/teamsManualAuth';

export function HeaderAuth() {
  const teamsEmbed = useTeamsEmbed();
  const afterSignOutUrl = teamsEmbed ? teamsHomeWithSignedOut() : '/sign-in';

  if (isGuestMode()) {
    return <GuestAccountButton />;
  }

  if (teamsEmbed) {
    return <TeamsAccountButton />;
  }

  return <SignOutUserButton afterSignOutUrl={afterSignOutUrl} />;
}
