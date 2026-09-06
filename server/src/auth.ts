import { createClerkClient, verifyToken } from '@clerk/backend';
import type { Socket } from 'socket.io';
import { ensureUser } from './db.js';

const secretKey = process.env.CLERK_SECRET_KEY;
if (!secretKey) {
  console.warn('CLERK_SECRET_KEY is not set — authentication will fail.');
}

const clerk = secretKey ? createClerkClient({ secretKey }) : null;

export interface AuthContext {
  clerkUserId: string;
  userId: string;
}

export async function authenticateToken(token: string | undefined): Promise<AuthContext | null> {
  if (!token || !secretKey) return null;
  try {
    const payload = await verifyToken(token, { secretKey });
    const clerkUserId = payload.sub;
    if (!clerkUserId) return null;

    let email: string | null = null;
    try {
      const user = clerk ? await clerk.users.getUser(clerkUserId) : null;
      email = user?.primaryEmailAddress?.emailAddress ?? null;
    } catch {
      // User record is optional for gameplay; continue with Clerk ID only.
    }

    const user = await ensureUser(clerkUserId, email);
    return { clerkUserId, userId: user.id };
  } catch (err) {
    console.error('Clerk token verification failed:', err);
    return null;
  }
}

export function getSocketAuth(socket: Socket): AuthContext | null {
  return (socket.data.auth as AuthContext | undefined) ?? null;
}

export function getSocketUserId(socket: Socket): string | null {
  return getSocketAuth(socket)?.clerkUserId ?? null;
}
