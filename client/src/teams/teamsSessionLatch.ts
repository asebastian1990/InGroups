const LATCH_KEY = 'ingroups_teams_clerk_latch';

export function latchTeamsClerkSession(email: string | null): void {
  try {
    sessionStorage.setItem(LATCH_KEY, JSON.stringify({ email }));
  } catch {
    // Ignore private mode / blocked storage.
  }
}

export function readTeamsClerkLatch(): { email: string | null } | null {
  try {
    const raw = sessionStorage.getItem(LATCH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { email?: string | null };
    return { email: parsed.email ?? null };
  } catch {
    return null;
  }
}

export function clearTeamsClerkLatch(): void {
  try {
    sessionStorage.removeItem(LATCH_KEY);
  } catch {
    // Ignore private mode / blocked storage.
  }
}

export function hasTeamsClerkLatch(): boolean {
  return readTeamsClerkLatch() !== null;
}
