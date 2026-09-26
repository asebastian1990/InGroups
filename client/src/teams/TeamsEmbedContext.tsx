import { createContext, useContext, type ReactNode } from 'react';
import type { TeamsProfile } from './types';
import { defaultTeamsProfile } from './types';

const TeamsEmbedContext = createContext(false);
const TeamsProfileContext = createContext<TeamsProfile>(defaultTeamsProfile);
const TeamsClerkUiContext = createContext(false);

export function TeamsEmbedProvider({
  children,
  profile,
  clerkUiEnabled,
}: {
  children: ReactNode;
  profile: TeamsProfile;
  clerkUiEnabled: boolean;
}) {
  return (
    <TeamsEmbedContext.Provider value={true}>
      <TeamsProfileContext.Provider value={profile}>
        <TeamsClerkUiContext.Provider value={clerkUiEnabled}>{children}</TeamsClerkUiContext.Provider>
      </TeamsProfileContext.Provider>
    </TeamsEmbedContext.Provider>
  );
}

export function useTeamsEmbed(): boolean {
  return useContext(TeamsEmbedContext);
}

export function useTeamsProfile(): TeamsProfile {
  return useContext(TeamsProfileContext);
}

/** True once Teams SSO / Clerk session is established this load (immune to isSignedIn flicker). */
export function useTeamsClerkUi(): boolean {
  return useContext(TeamsClerkUiContext);
}
