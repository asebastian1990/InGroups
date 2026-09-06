import { UserButton } from '@clerk/clerk-react';
import { exitGuestMode, isGuestMode } from '../api';

export function HeaderAuth() {
  if (isGuestMode()) {
    return (
      <button
        type="button"
        className="sign-in-btn"
        onClick={() => {
          exitGuestMode();
          window.location.href = '/sign-in';
        }}
      >
        Sign in
      </button>
    );
  }

  return <UserButton afterSignOutUrl="/sign-in" />;
}
