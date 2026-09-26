import { configureGuestAuth } from '../api';
import { CustomSignInScreen } from '../auth/CustomSignInScreen';
import { markLandingHelpHint } from '../auth/landingHelpHint';

export function TeamsManualSignInScreen({
  onContinueAsGuest,
  onRetryTeamsSso,
}: {
  onContinueAsGuest: () => void;
  onRetryTeamsSso: () => void;
}) {
  const continueAsGuest = () => {
    configureGuestAuth();
    markLandingHelpHint();
    onContinueAsGuest();
  };

  return (
    <div className="app app--teams app--auth">
      <main className="app-content auth-screen">
        <button type="button" className="btn btn-primary auth-form-submit" onClick={onRetryTeamsSso}>
          Sign in with Microsoft Teams
        </button>
        <div className="auth-divider">
          <span>or</span>
        </div>
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
