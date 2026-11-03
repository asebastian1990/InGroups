import { app } from '@microsoft/teams-js';
import { prefersBrowserNavigationForExternalLinks } from './teamsHost';

export type OpenExternalLinkOptions = {
  hostName?: string | null;
};

/** Synchronous navigation while the user-gesture is still active (iframe / M365 app). */
function tryOpenInBrowser(url: string): boolean {
  try {
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (opened) {
      try {
        opened.opener = null;
      } catch {
        /* cross-origin */
      }
      return true;
    }
  } catch {
    /* fall through */
  }

  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    return true;
  } catch {
    return false;
  }
}

/** Open a URL outside the host iframe (Teams tab, Outlook, M365 app, etc.). */
export async function openExternalLink(
  url: string,
  options?: OpenExternalLinkOptions
): Promise<void> {
  const preferBrowser =
    options?.hostName !== undefined
      ? prefersBrowserNavigationForExternalLinks(options.hostName)
      : false;

  if (preferBrowser) {
    if (tryOpenInBrowser(url)) {
      return;
    }
    window.location.assign(url);
    return;
  }

  try {
    await app.openLink(url);
  } catch (err) {
    console.warn('[teams] app.openLink failed, using window.open:', err);
    if (!tryOpenInBrowser(url)) {
      window.location.assign(url);
    }
  }
}
