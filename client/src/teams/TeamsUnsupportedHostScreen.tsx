import { useCallback, useEffect } from 'react';
import { Logo } from '../components/Logo';
import { teamsTabDeepLink } from './constants';
import { openExternalLink } from './openExternalLink';
import { notifyTeamsContentSuccess } from './teamsNativeLoading';

const PUBLIC_SITE_URL = 'https://ingroups.annaliese-sebastian.com/';
const TEAMS_WEB_URL = 'https://teams.microsoft.com/';

export function TeamsUnsupportedHostScreen() {
  useEffect(() => {
    notifyTeamsContentSuccess();
  }, []);

  const openTeams = useCallback(() => {
    void openExternalLink(teamsTabDeepLink('/teams'));
  }, []);

  const openTeamsWeb = useCallback(() => {
    void openExternalLink(TEAMS_WEB_URL);
  }, []);

  const openWebsite = useCallback(() => {
    void openExternalLink(PUBLIC_SITE_URL);
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
        <p className="teams-host-gate-note">
          The buttons below open your browser or the Teams app — they will not load inside this
          window.
        </p>
        <div className="teams-host-gate-actions">
          <button type="button" className="btn btn-primary btn-full" onClick={openTeams}>
            Open InGroups in Microsoft Teams
          </button>
          <button type="button" className="btn btn-full" onClick={openTeamsWeb}>
            Open teams.microsoft.com
          </button>
          <button type="button" className="btn btn-full" onClick={openWebsite}>
            Open ingroups.annaliese-sebastian.com
          </button>
        </div>
      </main>
    </div>
  );
}
