export interface TeamsProfile {
  inTeams: boolean;
  hostName: string | null;
  displayName: string | null;
  loginHint: string | null;
  userId: string | null;
  meetingId: string | null;
  frameContext: string | null;
  signedInWithTeams: boolean;
  signedInEmail: string | null;
}

export const defaultTeamsProfile: TeamsProfile = {
  inTeams: false,
  hostName: null,
  displayName: null,
  loginHint: null,
  userId: null,
  meetingId: null,
  frameContext: null,
  signedInWithTeams: false,
  signedInEmail: null,
};
