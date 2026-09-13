import { v4 as uuidv4 } from 'uuid';
import type { Group, Player, RoomState } from '../../shared/types.js';
import {
  FREE_WORD_SETS,
  MIN_IN_GROUP_SIZE,
  MIN_PLAYERS,
  MAX_ROUND_DURATION_MINUTES,
  MIN_ROUND_DURATION_MINUTES,
  MIN_WIN_CONDITION_POINTS,
  MAX_WIN_CONDITION_POINTS,
  DEFAULT_WIN_CONDITION_POINTS,
  OUT_GROUP_PHASE_SECONDS,
} from '../../shared/types.js';

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
    roundSpeedBonus: 0,
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
    roundDurationMinutes: 0,
    hostId,
    waitingForHost: true,
    chatMessages: [],
    needsReshuffle: false,
    roundNotice: null,
    winConditionPoints: DEFAULT_WIN_CONDITION_POINTS,
    inGroupSpeedBonus: false,
    roundPhase: 'inGroup',
    outGroupTimer: null,
    outGroupStartedAt: null,
    roundDurationSecondsAtStart: null,
    inGroupTimerRemainingAtLock: null,
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

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleArraySeeded<T>(arr: T[], seed: string): T[] {
  const a = [...arr];
  const random = mulberry32(hashSeed(seed));
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Per-player word order — same words, stable shuffle per player for the round. */
export function shuffleWordsForPlayer(
  words: string[],
  roomCode: string,
  roundStartedAt: number,
  playerId: string
): string[] {
  if (words.length === 0) return words;
  return shuffleArraySeeded(words, `${roomCode}:${roundStartedAt}:${playerId}`);
}

export function clampRoundDurationMinutes(minutes: number): number {
  const rounded = Math.round(minutes);
  return Math.min(MAX_ROUND_DURATION_MINUTES, Math.max(MIN_ROUND_DURATION_MINUTES, rounded));
}

export function getRoundDurationSeconds(room: RoomState): number {
  return room.roundDurationMinutes > 0 ? room.roundDurationMinutes * 60 : 0;
}

export function getRemainingTime(room: RoomState): number | null {
  const durationSeconds = getRoundDurationSeconds(room);
  if (durationSeconds === 0) return null;
  if (!room.roundStartedAt) return durationSeconds;
  const elapsed = Math.floor((Date.now() - room.roundStartedAt) / 1000);
  return Math.max(0, durationSeconds - elapsed);
}

export function isRoundExpired(room: RoomState): boolean {
  const remaining = getRemainingTime(room);
  return remaining !== null && remaining <= 0;
}

export function clampWinConditionPoints(points: number): number {
  const rounded = Math.round(points);
  if (rounded <= MIN_WIN_CONDITION_POINTS) return MIN_WIN_CONDITION_POINTS;
  return Math.min(MAX_WIN_CONDITION_POINTS, Math.max(1, rounded));
}

export function allInGroupGuessed(room: RoomState): boolean {
  const inGroup = room.groups.find((g) => g.isInGroup);
  if (!inGroup) return false;
  return inGroup.playerIds.every((id) => {
    const player = room.players.find((p) => p.id === id);
    return player?.guess !== null && player?.guess !== undefined;
  });
}

export function allOutGroupGuessed(room: RoomState): boolean {
  const outGroups = room.groups.filter((g) => !g.isInGroup);
  for (const group of outGroups) {
    for (const id of group.playerIds) {
      const player = room.players.find((p) => p.id === id);
      if (!player || player.guess === null) return false;
    }
  }
  return outGroups.length > 0;
}

export function getOutGroupRemainingTime(room: RoomState): number | null {
  if (!room.outGroupStartedAt) return OUT_GROUP_PHASE_SECONDS;
  const elapsed = Math.floor((Date.now() - room.outGroupStartedAt) / 1000);
  return Math.max(0, OUT_GROUP_PHASE_SECONDS - elapsed);
}

export function isOutGroupPhaseExpired(room: RoomState): boolean {
  const remaining = getOutGroupRemainingTime(room);
  return remaining !== null && remaining <= 0;
}

export function usesSplitTimer(room: RoomState): boolean {
  return room.roundDurationMinutes > 0;
}

export function canPlayerSubmitGuess(room: RoomState, playerId: string): boolean {
  if (!usesSplitTimer(room)) return true;
  const group = room.groups.find((g) => g.playerIds.includes(playerId));
  if (!group) return false;
  if (room.roundPhase === 'inGroup') return group.isInGroup;
  if (room.roundPhase === 'outGroup') return !group.isInGroup;
  return true;
}

export function computeSpeedBonusTier(remainingSeconds: number, totalSeconds: number): number {
  if (totalSeconds <= 0) return 0;
  const fraction = remainingSeconds / totalSeconds;
  if (fraction >= 0.75) return 3;
  if (fraction >= 0.5) return 2;
  if (fraction >= 0.25) return 1;
  return 0;
}

export function computeActiveSpeedBonus(room: RoomState): number | null {
  if (!room.inGroupSpeedBonus || !usesSplitTimer(room)) return null;
  if (room.phase !== 'playing' || room.roundPhase !== 'inGroup') return null;
  const total = room.roundDurationSecondsAtStart ?? getRoundDurationSeconds(room);
  if (total <= 0) return null;
  const remaining = getRemainingTime(room) ?? 0;
  return computeSpeedBonusTier(remaining, total);
}

export function didInGroupWinRound(points: Map<string, number>, room: RoomState): boolean {
  const inGroup = room.groups.find((g) => g.isInGroup);
  if (!inGroup) return false;
  return inGroup.playerIds.some((id) => (points.get(id) ?? 0) > 0);
}

export interface RoundScoreBreakdown {
  basePoints: Map<string, number>;
  speedBonuses: Map<string, number>;
}

export function applyRoundScores(room: RoomState): RoundScoreBreakdown {
  const basePoints = calculateScores(room);
  const speedBonuses = new Map<string, number>();
  room.players.forEach((p) => speedBonuses.set(p.id, 0));

  if (
    room.inGroupSpeedBonus &&
    room.inGroupTimerRemainingAtLock !== null &&
    room.roundDurationSecondsAtStart &&
    room.roundDurationSecondsAtStart > 0 &&
    didInGroupWinRound(basePoints, room)
  ) {
    const bonus = computeSpeedBonusTier(
      room.inGroupTimerRemainingAtLock,
      room.roundDurationSecondsAtStart
    );
    if (bonus > 0) {
      const inGroup = room.groups.find((g) => g.isInGroup);
      if (inGroup) {
        inGroup.playerIds.forEach((id) => {
          if ((basePoints.get(id) ?? 0) > 0) {
            speedBonuses.set(id, bonus);
          }
        });
      }
    }
  }

  return { basePoints, speedBonuses };
}

export function shouldEndGame(room: RoomState): boolean {
  if (room.winConditionPoints <= 0) return false;
  return room.players.some((p) => p.score >= room.winConditionPoints);
}

export function getWinnerIds(room: RoomState): string[] {
  if (room.players.length === 0) return [];
  const maxScore = Math.max(...room.players.map((p) => p.score));
  return room.players.filter((p) => p.score === maxScore).map((p) => p.id);
}

export function clearOutGroupGuesses(room: RoomState): void {
  const outGroups = room.groups.filter((g) => !g.isInGroup);
  for (const group of outGroups) {
    for (const id of group.playerIds) {
      const player = room.players.find((p) => p.id === id);
      if (player) player.guess = null;
    }
  }
}

export function transitionToOutGroupPhase(room: RoomState): void {
  room.inGroupTimerRemainingAtLock = getRemainingTime(room) ?? 0;
  room.roundPhase = 'outGroup';
  room.outGroupStartedAt = Date.now();
  room.outGroupTimer = OUT_GROUP_PHASE_SECONDS;
  clearOutGroupGuesses(room);
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

  // Rule 1: All Out Group members choose the same word tied for most popular in In Group → +2 each
  for (const group of outGroups) {
    const groupPlayers = group.playerIds
      .map((id) => room.players.find((p) => p.id === id))
      .filter(Boolean) as Player[];

    if (groupPlayers.length === 0) continue;

    const sharedGuess = groupPlayers[0]?.guess;
    if (!sharedGuess) continue;

    const allSameGuess = groupPlayers.every((p) => p.guess === sharedGuess);
    if (!allSameGuess) continue;

    const inCount = guessCounts.get(sharedGuess) ?? 0;
    if (inCount >= mostPopularCount && inCount > 0) {
      groupPlayers.forEach((p) => points.set(p.id, 2));
      return points;
    }
  }

  // Rule 2: Partial Out Group match on an In Group word → +1 each in that Out Group
  for (const group of outGroups) {
    const groupPlayers = group.playerIds
      .map((id) => room.players.find((p) => p.id === id))
      .filter(Boolean) as Player[];

    if (groupPlayers.length === 0) continue;

    for (const [word, inCount] of guessCounts) {
      const outMatching = groupPlayers.filter((p) => p.guess === word).length;
      if (outMatching < 2 || outMatching < inCount) continue;

      const allSameWord =
        outMatching === groupPlayers.length &&
        groupPlayers.every((p) => p.guess === word);
      if (allSameWord && inCount >= mostPopularCount) continue;

      groupPlayers.forEach((p) => points.set(p.id, 1));
      return points;
    }
  }

  // Rule 3: All In Group choose same word → +2 each
  if (allInGroupAgree && inGroupGuesses.length > 0) {
    inGroupPlayers.forEach((p) => points.set(p.id, 2));
    return points;
  }

  // Rule 4: 2+ In Group agree on a word, but not all → +1 each in In Group
  if (mostPopularCount >= 2 && !allInGroupAgree) {
    inGroupPlayers.forEach((p) => points.set(p.id, 1));
  }

  return points;
}

export function allPlayersGuessed(room: RoomState): boolean {
  return room.players.every((p) => p.guess !== null);
}
