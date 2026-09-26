type RecoverFn = () => Promise<boolean>;
type AuthLostFn = () => void;

let recoverFn: RecoverFn | null = null;
let authLostFn: AuthLostFn | null = null;

export function isTeamsAppPath(): boolean {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  return path === '/teams' || path.startsWith('/teams/');
}

export function registerTeamsAuthRecovery(fn: RecoverFn | null): void {
  recoverFn = fn;
}

export function registerTeamsAuthLostHandler(fn: AuthLostFn | null): void {
  authLostFn = fn;
}

let recoveryInFlight: Promise<boolean> | null = null;

export async function recoverTeamsAuth(): Promise<boolean> {
  if (!recoverFn) return false;
  if (!recoveryInFlight) {
    recoveryInFlight = recoverFn().finally(() => {
      recoveryInFlight = null;
    });
  }
  return recoveryInFlight;
}

export function notifyTeamsAuthLost(): void {
  authLostFn?.();
}
