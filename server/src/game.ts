import { v4 as uuidv4 } from 'uuid';
import type { Group, Player, RoomState } from '../../shared/types.js';
import { FREE_WORD_SETS, MIN_IN_GROUP_SIZE, MIN_PLAYERS } from '../../shared/types.js';

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function createRoom(hostName: string, hostId: string): RoomState {
  const code = generateRoomCode();
  const host: Player = {
    id: hostId,
    name: hostName.trim(),
    score: 0,
    isHost: true,
    guess: null,
    roundPoints: 0,
  };

  return {
    code,
    phase: 'lobby',
    numGroups: 2,
    wordSetId: 'animals',
    wordSetName: 'Animals',
    players: [host],
    groups: [],
    roundWords: [],
    roundTimer: null,
    roundStartedAt: null,
    hostId,
    waitingForHost: true,
    chatMessages: [],
    needsReshuffle: false,
    roundNotice: null,
  };
}

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function hasGroupBelowMinSize(groups: Group[]): boolean {
  if (groups.length === 0) return false;
  const inGroup = groups.find((g) => g.isInGroup);
  if (!inGroup || inGroup.playerIds.length < MIN_IN_GROUP_SIZE) return true;
  return groups.some((g) => g.playerIds.length === 0);
}

export function resolveUniquePlayerName(existingNames: string[], requestedName: string): string {
  const name = requestedName.trim();
  if (!name) return name;

  const taken = new Set(existingNames);
  if (!taken.has(name)) return name;

  let suffix = 2;
  while (taken.has(`${name} (${suffix})`)) {
    suffix++;
  }
  return `${name} (${suffix})`;
}

export function maxGroupsForPlayers(playerCount: number): number {
  return Math.max(2, playerCount - 1);
}

export function validateGroupCount(playerCount: number, numGroups: number): string | null {
  if (playerCount < MIN_PLAYERS) {
    return `Need at least ${MIN_PLAYERS} players.`;
  }
  if (numGroups < 2) {
    return 'Need at least 2 groups.';
  }
  const maxGroups = maxGroupsForPlayers(playerCount);
  if (numGroups > maxGroups) {
    return `Not enough players for ${numGroups} groups (In Group needs at least ${MIN_IN_GROUP_SIZE} players).`;
  }
  const inGroupSize = Math.ceil(playerCount / numGroups);
  if (inGroupSize < MIN_IN_GROUP_SIZE) {
    return `In Group needs at least ${MIN_IN_GROUP_SIZE} players for ${numGroups} groups.`;
  }
  return null;
}

export function assignGroups(players: Player[], numGroups: number): Group[] {
  const error = validateGroupCount(players.length, numGroups);
  if (error) throw new Error(error);

  const shuffled = shuffleArray(players);
  const groups: Group[] = [];
  for (let i = 0; i < numGroups; i++) {
    groups.push({ id: i, playerIds: [], isInGroup: i === 0 });
  }

  shuffled.forEach((player, idx) => {
    groups[idx % numGroups].playerIds.push(player.id);
  });

  return groups;
}

export function shiftGroups(groups: Group[]): Group[] {
  if (groups.length < 2) return groups;
  const inGroupIdx = groups.findIndex((g) => g.isInGroup);
  const newInGroupIdx = (inGroupIdx + groups.length - 1) % groups.length;
  return groups.map((g, i) => ({ ...g, isInGroup: i === newInGroupIdx }));
}

/** Place a newly joined player into groups after the game has started. */
export function assignJoinedPlayerToGroup(groups: Group[], playerId: string): Group[] {
  if (groups.length === 0) return groups;
  if (groups.some((g) => g.playerIds.includes(playerId))) return groups;

  const inGroup = groups.find((g) => g.isInGroup);
  if (!inGroup) return groups;

  if (inGroup.playerIds.length < MIN_IN_GROUP_SIZE) {
    return groups.map((g) =>
      g.isInGroup ? { ...g, playerIds: [...g.playerIds, playerId] } : g
    );
  }

  const emptyOutGroup = groups.find((g) => !g.isInGroup && g.playerIds.length === 0);
  if (emptyOutGroup) {
    return groups.map((g) =>
      g.id === emptyOutGroup.id ? { ...g, playerIds: [...g.playerIds, playerId] } : g
    );
  }

  return groups.map((g) =>
    g.isInGroup ? { ...g, playerIds: [...g.playerIds, playerId] } : g
  );
}

export function movePlayerToGroup(
  groups: Group[],
  playerId: string,
  destination: 'inGroup' | number
): { groups: Group[]; error?: string } {
  const sourceGroup = groups.find((g) => g.playerIds.includes(playerId));
  if (!sourceGroup) {
    return { groups, error: 'Player is not assigned to a group.' };
  }

  if (destination === 'inGroup') {
    const inGroup = groups.find((g) => g.isInGroup);
    if (!inGroup) {
      return { groups, error: 'In Group not found.' };
    }
    if (sourceGroup.isInGroup) {
      return { groups, error: 'Player is already in the In Group.' };
    }

    const next = groups.map((g) => ({
      ...g,
      playerIds: g.playerIds.filter((id) => id !== playerId),
    }));
    return {
      groups: next.map((g) =>
        g.isInGroup ? { ...g, playerIds: [...g.playerIds, playerId] } : g
      ),
    };
  }

  const targetGroup = groups.find((g) => g.id === destination && !g.isInGroup);
  if (!targetGroup) {
    return { groups, error: 'Out Group not found.' };
  }
  if (sourceGroup.id === targetGroup.id) {
    return { groups, error: 'Player is already in that Out Group.' };
  }
  if (!sourceGroup.isInGroup) {
    return { groups, error: 'Use Move to In Group for Out Group players.' };
  }

  const next = groups.map((g) => ({
    ...g,
    playerIds: g.playerIds.filter((id) => id !== playerId),
  }));
  return {
    groups: next.map((g) =>
      g.id === targetGroup.id ? { ...g, playerIds: [...g.playerIds, playerId] } : g
    ),
  };
}

export function selectRoundWords(wordSetId: string, customWords?: string[]): string[] {
  let words: string[];
  if (customWords) {
    words = customWords;
  } else {
    const set = FREE_WORD_SETS.find((s) => s.id === wordSetId);
    words = set?.words ?? FREE_WORD_SETS[0].words;
  }
  return shuffleArray(words).slice(0, 20);
}

export function calculateScores(room: RoomState): Map<string, number> {
  const points = new Map<string, number>();
  room.players.forEach((p) => points.set(p.id, 0));

  const inGroup = room.groups.find((g) => g.isInGroup);
  if (!inGroup) return points;

  const inGroupPlayers = inGroup.playerIds
    .map((id) => room.players.find((p) => p.id === id))
    .filter(Boolean) as Player[];

  const inGroupGuesses = inGroupPlayers.map((p) => p.guess).filter(Boolean) as string[];
  const guessCounts = new Map<string, number>();
  inGroupGuesses.forEach((g) => guessCounts.set(g, (guessCounts.get(g) ?? 0) + 1));

  let mostPopularWord = '';
  let mostPopularCount = 0;
  guessCounts.forEach((count, word) => {
    if (count > mostPopularCount) {
      mostPopularCount = count;
      mostPopularWord = word;
    }
  });

  const allInGroupAgree =
    inGroupGuesses.length === inGroupPlayers.length &&
    inGroupGuesses.every((g) => g === inGroupGuesses[0]);

  const outGroups = room.groups.filter((g) => !g.isInGroup);

  // Rule 1: All non-In Group members choose the most popular In Group word → +2 each
  for (const group of outGroups) {
    const groupPlayers = group.playerIds
      .map((id) => room.players.find((p) => p.id === id))
      .filter(Boolean) as Player[];

    if (groupPlayers.length === 0) continue;

    const allMatchPopular =
      mostPopularWord &&
      groupPlayers.every((p) => p.guess === mostPopularWord);

    if (allMatchPopular) {
      groupPlayers.forEach((p) => points.set(p.id, 2));
      return points;
    }
  }

  // Rule 2: 2+ In Group agree on a word AND another group matches/exceeds → +1 each in that group
  if (mostPopularCount >= 2) {
    for (const group of outGroups) {
      const groupPlayers = group.playerIds
        .map((id) => room.players.find((p) => p.id === id))
        .filter(Boolean) as Player[];

      const matchingGuesses = groupPlayers.filter((p) => p.guess === mostPopularWord).length;
      if (matchingGuesses >= mostPopularCount) {
        groupPlayers.forEach((p) => points.set(p.id, 1));
        return points;
      }
    }
  }

  // Rule 3: All In Group choose same word → +2 each
  if (allInGroupAgree && inGroupGuesses.length > 0) {
    inGroupPlayers.forEach((p) => points.set(p.id, 2));
    return points;
  }

  // Rule 4: Some (but not all) In Group members agree → +1 each who matched
  if (mostPopularCount >= 2 && !allInGroupAgree) {
    inGroupPlayers.forEach((p) => {
      if (p.guess === mostPopularWord) {
        points.set(p.id, 1);
      }
    });
  }

  return points;
}

export function allPlayersGuessed(room: RoomState): boolean {
  return room.players.every((p) => p.guess !== null);
}
