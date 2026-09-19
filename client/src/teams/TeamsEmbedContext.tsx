import { createContext, useContext, type ReactNode } from 'react';
import type { TeamsProfile } from './types';
import { defaultTeamsProfile } from './types';

const TeamsEmbedContext = createContext(false);
const TeamsProfileContext = createContext<TeamsProfile>(defaultTeamsProfile);

export function TeamsEmbedProvider({
  children,
  profile,
}: {
  children: ReactNode;
  profile: TeamsProfile;
}) {
  return (
    <TeamsEmbedContext.Provider value={true}>
      <TeamsProfileContext.Provider value={profile}>{children}</TeamsProfileContext.Provider>
    </TeamsEmbedContext.Provider>
  );
}

export function useTeamsEmbed(): boolean {
  return useContext(TeamsEmbedContext);
}

export function useTeamsProfile(): TeamsProfile {
  return useContext(TeamsProfileContext);
}
