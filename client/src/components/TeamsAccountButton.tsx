import { useClerk } from '@clerk/clerk-react';
import { useEffect, useRef, useState } from 'react';
import { useTeamsClerkUi, useTeamsProfile } from '../teams/TeamsEmbedContext';
import { clearTeamsClerkLatch, readTeamsClerkLatch } from '../teams/teamsSessionLatch';
import { markTeamsSignedOut, teamsHomeWithSignedOut } from '../teams/teamsManualAuth';

/**
 * Teams iframe: native account circle (Clerk UserButton often renders empty after interaction).
 * Clerk still backs the session for API calls; this control only handles sign-out UX.
 */
export function TeamsAccountButton() {
  const teamsClerkUi = useTeamsClerkUi();
  const teamsProfile = useTeamsProfile();
  const latch = readTeamsClerkLatch();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const signedIn =
    teamsClerkUi || latch !== null || teamsProfile.signedInWithTeams;

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

  if (!signedIn) {
    return null;
  }

  const email = latch?.email ?? teamsProfile.signedInEmail;
  const label = email?.split('@')[0] ?? teamsProfile.displayName?.trim() ?? 'Account';
  const initial = (label[0] ?? 'A').toUpperCase();

  const handleSignOut = () => {
    setOpen(false);
    clearTeamsClerkLatch();
    markTeamsSignedOut();
    void signOut().finally(() => {
      window.location.href = teamsHomeWithSignedOut();
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
        title={email ?? label}
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
