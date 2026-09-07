import { createClerkClient, verifyToken } from '@clerk/backend';
import type { Socket } from 'socket.io';
import { ensureUser } from './db.js';

const secretKey = process.env.CLERK_SECRET_KEY;
if (!secretKey) {
  console.warn('CLERK_SECRET_KEY is not set — authentication will fail.');
}

const clerk = secretKey ? createClerkClient({ secretKey }) : null;

const GUEST_ID_PATTERN =
  /^guest_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface AuthContext {
  playerId: string;
  userId: string | null;
  isGuest: boolean;
}

export function isValidGuestId(id: string): boolean {
  return GUEST_ID_PATTERN.test(id);
}

export function guestsAllowed(): boolean {
  return process.env.ALLOW_GUEST !== 'false';
}

async function authenticateClerkToken(token: string): Promise<{ clerkUserId: string; userId: string } | null> {
  if (!secretKey) return null;
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

export async function authenticateBearerToken(token: string): Promise<AuthContext | null> {
  const clerk = await authenticateClerkToken(token);
  if (!clerk) return null;
  return { playerId: clerk.clerkUserId, userId: clerk.userId, isGuest: false };
}

export async function authenticateConnection(handshakeAuth: {
  token?: string;
  guestId?: string;
}): Promise<AuthContext | null> {
  if (handshakeAuth.token) {
    const clerk = await authenticateClerkToken(handshakeAuth.token);
    if (clerk) {
      return { playerId: clerk.clerkUserId, userId: clerk.userId, isGuest: false };
    }
  }

  const guestId = handshakeAuth.guestId?.trim();
  if (guestId && isValidGuestId(guestId) && guestsAllowed()) {
    return { playerId: guestId, userId: null, isGuest: true };
  }

  return null;
}

export function getSocketAuth(socket: Socket): AuthContext | null {
  return (socket.data.auth as AuthContext | undefined) ?? null;
}

export function getPlayerId(socket: Socket): string | null {
  return getSocketAuth(socket)?.playerId ?? null;
}

export function isGuestSocket(socket: Socket): boolean {
  return getSocketAuth(socket)?.isGuest ?? false;
}
