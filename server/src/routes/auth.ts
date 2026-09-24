import { Router } from 'express';
import { type AuthedRequest, requireClerkAuth } from '../httpAuth.js';

export const authRouter = Router();

/** Ensure the signed-in Clerk user has a row in Neon (idempotent). */
authRouter.get('/me', requireClerkAuth, (req, res) => {
  const { playerId, userId } = (req as AuthedRequest).auth;
  res.json({ clerkUserId: playerId, userId });
});
