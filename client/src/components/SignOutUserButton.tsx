import { UserButton } from '@clerk/clerk-react';

/** Clerk account circle with sign-out only (Google, email, etc.). */
export function SignOutUserButton({ afterSignOutUrl }: { afterSignOutUrl: string }) {
  return (
    <UserButton afterSignOutUrl={afterSignOutUrl}>
      <UserButton.MenuItems>
        <UserButton.Action label="signOut" />
      </UserButton.MenuItems>
    </UserButton>
  );
}
