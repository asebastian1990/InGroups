import { app } from '@microsoft/teams-js';

/** Open a URL outside the host iframe (Teams tab, Outlook, M365 app, etc.). */
export async function openExternalLink(url: string): Promise<void> {
  try {
    await app.openLink(url);
  } catch (err) {
    console.warn('[teams] app.openLink failed, using window.open:', err);
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (!opened) {
      window.location.assign(url);
    }
  }
}
