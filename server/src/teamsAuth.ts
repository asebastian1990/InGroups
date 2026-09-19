import { createClerkClient } from '@clerk/backend';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const clientId = process.env.TEAMS_AAD_CLIENT_ID?.trim();
const appUri = process.env.TEAMS_AAD_APP_URI?.trim();
const secretKey = process.env.CLERK_SECRET_KEY;

const clerk = secretKey ? createClerkClient({ secretKey }) : null;

const JWKS = createRemoteJWKSet(
  new URL('https://login.microsoftonline.com/common/discovery/v2.0/keys'),
);

export interface TeamsIdentity {
  oid: string;
  email: string | null;
  displayName: string | null;
}

export function teamsSsoConfigured(): boolean {
  return !!(clientId && appUri && clerk);
}

export async function verifyTeamsSsoToken(token: string): Promise<TeamsIdentity> {
  if (!clientId || !appUri) {
    throw new Error('Teams SSO is not configured on the server.');
  }

  const { payload } = await jwtVerify(token, JWKS, {
    audience: [clientId, appUri],
  });

  const oid = typeof payload.oid === 'string' ? payload.oid : null;
  if (!oid) {
    throw new Error('Teams token missing user id.');
  }

  const emailRaw =
    (typeof payload.preferred_username === 'string' && payload.preferred_username) ||
    (typeof payload.upn === 'string' && payload.upn) ||
    (typeof payload.email === 'string' && payload.email) ||
    null;

  const displayName = typeof payload.name === 'string' ? payload.name : null;

  return {
    oid,
    email: emailRaw?.includes('@') ? emailRaw.toLowerCase() : null,
    displayName,
  };
}

export async function createClerkSignInTokenForTeams(
  identity: TeamsIdentity,
): Promise<{ signInToken: string; email: string | null; displayName: string | null }> {
  if (!clerk) {
    throw new Error('Clerk is not configured.');
  }

  let clerkUserId: string | null = null;

  if (identity.email) {
    const matches = await clerk.users.getUserList({ emailAddress: [identity.email], limit: 1 });
    clerkUserId = matches.data[0]?.id ?? null;
  }

  if (!clerkUserId) {
    const parts = (identity.displayName ?? '').trim().split(/\s+/).filter(Boolean);
    const firstName = parts[0] ?? undefined;
    const lastName = parts.length > 1 ? parts.slice(1).join(' ') : undefined;

    if (!identity.email) {
      throw new Error('Teams account has no email — cannot create an InGroups account.');
    }

    const created = await clerk.users.createUser({
      emailAddress: [identity.email],
      firstName,
      lastName,
      skipPasswordRequirement: true,
    });
    clerkUserId = created.id;
  }

  const signIn = await clerk.signInTokens.createSignInToken({
    userId: clerkUserId,
    expiresInSeconds: 60 * 60,
  });

  return {
    signInToken: signIn.token,
    email: identity.email,
    displayName: identity.displayName,
  };
}
