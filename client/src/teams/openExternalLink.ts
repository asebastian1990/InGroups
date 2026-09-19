import { app } from '@microsoft/teams-js';

/** Open a URL outside the Teams tab iframe (required for Stripe checkout, etc.). */
export async function openExternalLink(url: string): Promise<void> {
  await app.openLink(url);
}
