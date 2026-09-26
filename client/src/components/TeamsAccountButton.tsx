import { useAuth, useClerk } from '@clerk/clerk-react';
import { useEffect, useRef, useState } from 'react';
import { SignOutUserButton } from './SignOutUserButton';
import { useTeamsClerkUi } from '../teams/TeamsEmbedContext';
import { readTeamsClerkLatch } from '../teams/teamsSessionLatch';
import { teamsHomeWithSignedOut } from '../teams/teamsManualAuth';

function TeamsAccountFallbackButton({ email }: { email: string | null }) {
  const { signOut } = useClerk();
  const afterSignOutUrl = teamsHomeWithSignedOut();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const label = email?.split('@')[0] ?? 'Account';
  const initial = (label[0] ?? 'A').toUpperCase();

  const handleSignOut = () => {
    setOpen(false);
    void signOut().finally(() => {
      window.location.href = afterSignOutUrl;
    });
  };

  return (
    <div className="account-menu-anchor" ref={rootRef}>
      <button
        type="button"
        className="account-circle-btn"
        aria-label="Account"
        aria-expanded={open}
        aria-haspopup="menu"
        title={email ?? 'Signed in'}
        onClick={() => setOpen((v) => !v)}
      >
        {initial}
      </button>
      {open && (
        <div className="account-menu-popup" role="menu">
          <button type="button" className="account-menu-item" role="menuitem" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

/** Teams iframe: Clerk UserButton when live; fallback circle when hooks flicker but session is latched. */
export function TeamsAccountButton() {
  const teamsClerkUi = useTeamsClerkUi();
  const latch = readTeamsClerkLatch();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const afterSignOutUrl = teamsHomeWithSignedOut();

  const sessionKnown = teamsClerkUi || latch !== null;
  const clerkLive = authLoaded && isSignedIn;

  if (!sessionKnown && !clerkLive) {
    return null;
  }

  if (clerkLive) {
    return <SignOutUserButton afterSignOutUrl={afterSignOutUrl} />;
  }

  return <TeamsAccountFallbackButton email={latch?.email ?? null} />;
}
