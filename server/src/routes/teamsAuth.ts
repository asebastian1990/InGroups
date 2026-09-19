import { Router } from 'express';
import { ensureUser } from '../db.js';
import {
  createClerkSignInTokenForTeams,
  teamsSsoConfigured,
  verifyTeamsSsoToken,
} from '../teamsAuth.js';

export const teamsAuthRouter = Router();

teamsAuthRouter.get('/status', (_req, res) => {
  res.json({ configured: teamsSsoConfigured() });
});

teamsAuthRouter.post('/teams', async (req, res) => {
  if (!teamsSsoConfigured()) {
    res.status(503).json({ error: 'Teams SSO is not configured on the server.' });
    return;
  }

  const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
  if (!token) {
    res.status(400).json({ error: 'Missing Teams SSO token.' });
    return;
  }

  try {
    const identity = await verifyTeamsSsoToken(token);
    const { signInToken, email, displayName } = await createClerkSignInTokenForTeams(identity);

    // Warm the Neon users row once Clerk session is established on the client.
    res.json({
      signInToken,
      email,
      displayName,
    });
  } catch (err) {
    console.error('Teams SSO error:', err);
    res.status(401).json({
      error: err instanceof Error ? err.message : 'Teams sign-in failed.',
    });
  }
});

/** Called after client establishes Clerk session to ensure DB user exists. */
teamsAuthRouter.post('/teams/linked', async (req, res) => {
  const clerkUserId = typeof req.body?.clerkUserId === 'string' ? req.body.clerkUserId.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : null;
  if (!clerkUserId) {
    res.status(400).json({ error: 'Missing clerkUserId.' });
    return;
  }

  try {
    const user = await ensureUser(clerkUserId, email);
    res.json({ userId: user.id });
  } catch (err) {
    console.error('Teams link error:', err);
    res.status(500).json({ error: 'Failed to link account.' });
  }
});
