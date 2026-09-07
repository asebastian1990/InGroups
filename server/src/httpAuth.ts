import type { NextFunction, Request, Response } from 'express';
import { authenticateBearerToken, type AuthContext } from './auth.js';

export type AuthedRequest = Request & { auth: AuthContext };

export async function requireClerkAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Sign in required' });
    return;
  }

  const auth = await authenticateBearerToken(header.slice(7));
  if (!auth) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return;
  }

  (req as AuthedRequest).auth = auth;
  next();
}
