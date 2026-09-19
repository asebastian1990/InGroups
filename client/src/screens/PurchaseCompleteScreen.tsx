import { teamsTabDeepLink } from '../teams/constants';

function readParams() {
  const params = new URLSearchParams(window.location.search);
  const purchase = params.get('purchase');
  return {
    success: purchase === 'success',
    cancelled: purchase === 'cancelled',
  };
}

export function PurchaseCompleteScreen() {
  const { success, cancelled } = readParams();
  const teamsLink = teamsTabDeepLink(
    cancelled
      ? '/teams?view=license&purchase=cancelled'
      : '/teams?view=license',
  );

  const openTeams = () => {
    window.location.href = teamsLink;
  };

  return (
    <div className="app">
      <main className="app-content purchase-complete">
        {success ? (
          <>
            <h1>Payment complete</h1>
            <p className="purchase-complete-lead">
              Your license is ready. Open InGroups in Microsoft Teams to view your keys or activate
              one on this account.
            </p>
          </>
        ) : cancelled ? (
          <>
            <h1>Checkout cancelled</h1>
            <p className="purchase-complete-lead">
              No charge was made. Return to InGroups in Microsoft Teams to try again.
            </p>
          </>
        ) : (
          <>
            <h1>InGroups</h1>
            <p className="purchase-complete-lead">Return to the app in Microsoft Teams.</p>
          </>
        )}

        <button type="button" className="btn btn-primary btn-full" onClick={openTeams}>
          Open Microsoft Teams
        </button>

        <p className="purchase-complete-note">
          Stripe opens in your browser, so checkout cannot return to the Teams tab automatically.
          Use the button above to switch back.
        </p>
      </main>
    </div>
  );
}
