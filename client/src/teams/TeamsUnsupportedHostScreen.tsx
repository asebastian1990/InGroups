import { useEffect } from 'react';
import { Logo } from '../components/Logo';
import { teamsTabDeepLink } from './constants';
import { notifyTeamsContentSuccess } from './teamsNativeLoading';

const PUBLIC_SITE_URL = 'https://ingroups.annaliese-sebastian.com/';

export function TeamsUnsupportedHostScreen() {
  useEffect(() => {
    notifyTeamsContentSuccess();
  }, []);

  return (
    <div className="app app--teams">
      <main className="app-content teams-host-gate">
        <Logo size={72} className="teams-host-gate-logo" />
        <h1 className="teams-host-gate-title">Use InGroups in Microsoft Teams</h1>
        <p className="teams-host-gate-lead">
          InGroups is built for Microsoft Teams — meetings, channels, and team tabs. It is not
          available in Outlook, the Microsoft 365 app, or other Microsoft hosts.
        </p>
        <div className="teams-host-gate-actions">
          <a className="btn btn-primary btn-full" href={teamsTabDeepLink('/teams')}>
            Open in Microsoft Teams
          </a>
          <a className="btn btn-full" href={PUBLIC_SITE_URL}>
            Open ingroups.annaliese-sebastian.com
          </a>
        </div>
      </main>
    </div>
  );
}
