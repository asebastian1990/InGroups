import { ClerkProvider } from '@clerk/clerk-react';
import type { ReactNode } from 'react';
import { TeamsAuthBootstrap } from './TeamsAuthBootstrap';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const SIGN_IN_PATH = '/sign-in';
const SIGN_UP_PATH = '/sign-up';

export function TeamsProviders({ children }: { children: ReactNode }) {
  if (!publishableKey) {
    return (
      <div className="app app--teams">
        <main className="app-content">
          <p className="error-msg">Missing VITE_CLERK_PUBLISHABLE_KEY in environment.</p>
        </main>
      </div>
    );
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl={SIGN_IN_PATH}
      signUpUrl={SIGN_UP_PATH}
      afterSignOutUrl="/teams"
      allowedRedirectOrigins={[window.location.origin]}
    >
      <TeamsAuthBootstrap>{children}</TeamsAuthBootstrap>
    </ClerkProvider>
  );
}
