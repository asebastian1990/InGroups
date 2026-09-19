import { useEffect, useState } from 'react';
import { app, pages } from '@microsoft/teams-js';

export function TeamsConfigScreen() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await app.initialize();
        const contentUrl = `${window.location.origin}/teams`;

        pages.config.registerOnSaveHandler((saveEvent) => {
          pages.config.setConfig({
            suggestedDisplayName: 'InGroups',
            entityId: 'ingroups',
            contentUrl,
            websiteUrl: contentUrl,
          });
          saveEvent.notifySuccess();
        });

        pages.config.setValidityState(true);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to initialize Teams config.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="app app--teams">
      <main className="app-content auth-screen">
        <h2 style={{ fontSize: '1.2rem', marginBottom: 12 }}>Add InGroups</h2>
        <p className="section-label">
          Save to add InGroups to this chat, channel, or meeting.
        </p>
        {error && <p className="error-msg">{error}</p>}
      </main>
    </div>
  );
}
