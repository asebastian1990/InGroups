import { useEffect, useRef, useState } from 'react';
import { exitGuestMode } from '../api';
import { useTeamsEmbed } from '../teams/TeamsEmbedContext';
import { teamsHomeWithSignedOut } from '../teams/teamsManualAuth';

/** Guest session: profile circle with sign-out-only menu (matches Clerk UserButton pattern). */
export function GuestAccountButton() {
  const teamsEmbed = useTeamsEmbed();
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

  const signOut = () => {
    setOpen(false);
    exitGuestMode();
    window.location.href = teamsEmbed ? teamsHomeWithSignedOut() : '/sign-in';
  };

  return (
    <div className="account-menu-anchor" ref={rootRef}>
      <button
        type="button"
        className="account-circle-btn account-circle-btn--guest"
        aria-label="Guest account"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        G
      </button>
      {open && (
        <div className="account-menu-popup" role="menu">
          <button type="button" className="account-menu-item" role="menuitem" onClick={signOut}>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
