import { configureGuestAuth } from '../api';
import { CustomSignInScreen } from '../auth/CustomSignInScreen';
import { markLandingHelpHint } from '../auth/landingHelpHint';
import { markTeamsManualAuth } from './teamsManualAuth';

export function TeamsManualSignInScreen({ onContinueAsGuest }: { onContinueAsGuest: () => void }) {
  const continueAsGuest = () => {
    markTeamsManualAuth();
    configureGuestAuth();
    markLandingHelpHint();
    onContinueAsGuest();
  };

  return (
    <div className="app app--teams app--auth">
      <main className="app-content auth-screen">
        <div className="auth-clerk">
          <CustomSignInScreen teamsEmbed />
        </div>
        <div className="guest-auth">
          <button type="button" className="btn" onClick={continueAsGuest}>
            Continue as Guest
          </button>
        </div>
      </main>
    </div>
  );
}
