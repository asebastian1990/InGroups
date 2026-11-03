import { useCallback, useEffect } from 'react';
import { Logo } from '../components/Logo';
import { openExternalLink } from './openExternalLink';
import { notifyTeamsContentSuccess } from './teamsNativeLoading';

const TEAMS_WEB_URL = 'https://teams.microsoft.com/';

export function TeamsUnsupportedHostScreen() {
  useEffect(() => {
    notifyTeamsContentSuccess();
  }, []);

  const openTeamsWeb = useCallback(() => {
    void openExternalLink(TEAMS_WEB_URL);
  }, []);

  return (
    <div className="app app--teams">
      <main className="app-content teams-host-gate">
        <Logo size={72} className="teams-host-gate-logo" />
        <h1 className="teams-host-gate-title">Use InGroups in Microsoft Teams</h1>
        <p className="teams-host-gate-lead">
          InGroups is built for Microsoft Teams: meetings, channels, and team tabs. It is not
          available in Outlook, the Microsoft 365 app, or other Microsoft hosts.
        </p>
        <div className="teams-host-gate-actions">
          <button type="button" className="btn btn-primary btn-full" onClick={openTeamsWeb}>
            Open teams.microsoft.com
          </button>
        </div>
      </main>
    </div>
  );
}
