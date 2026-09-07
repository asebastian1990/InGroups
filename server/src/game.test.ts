import { describe, it, expect } from 'vitest';
import { calculateScores, assignGroups, resolveUniquePlayerName, hasGroupBelowMinSize, movePlayerToGroup, assignJoinedPlayerToGroup } from './game.js';
import type { RoomState, Player, Group } from '../../shared/types.js';

function makePlayer(id: string, guess: string | null): Player {
  return { id, name: id, score: 0, isHost: false, guess, roundPoints: 0 };
}

function makeRoom(
  inGroupGuesses: (string | null)[],
  outGroupGuesses: string[][],
): RoomState {
  const inGroupIds = inGroupGuesses.map((_, i) => `in${i}`);
  const players: Player[] = inGroupGuesses.map((g, i) => makePlayer(`in${i}`, g));

  const groups = [{ id: 0, playerIds: inGroupIds, isInGroup: true }];

  outGroupGuesses.forEach((guesses, gi) => {
    const ids = guesses.map((_, pi) => `out${gi}_${pi}`);
    groups.push({ id: gi + 1, playerIds: ids, isInGroup: false });
    guesses.forEach((g, pi) => players.push(makePlayer(`out${gi}_${pi}`, g)));
  });

  return {
    code: 'TEST',
    phase: 'roundEnd',
    numGroups: groups.length,
    wordSetId: 'animals',
    wordSetName: 'Animals',
    players,
    groups,
    roundWords: [],
    roundTimer: null,
    roundStartedAt: null,
    hostId: 'in0',
    waitingForHost: true,
    chatMessages: [],
    needsReshuffle: false,
    roundNotice: null,
  };
}

describe('hasGroupBelowMinSize', () => {
  it('allows out groups with 1 player when in group has 2+', () => {
    expect(hasGroupBelowMinSize([
      { id: 0, playerIds: ['a', 'b'], isInGroup: true },
      { id: 1, playerIds: ['c'], isInGroup: false },
    ])).toBe(false);
  });

  it('detects in group with fewer than 2 players', () => {
    expect(hasGroupBelowMinSize([
      { id: 0, playerIds: ['a'], isInGroup: true },
      { id: 1, playerIds: ['b', 'c'], isInGroup: false },
    ])).toBe(true);
  });

  it('detects empty groups', () => {
    expect(hasGroupBelowMinSize([
      { id: 0, playerIds: ['a', 'b'], isInGroup: true },
      { id: 1, playerIds: [], isInGroup: false },
    ])).toBe(true);
  });
});

describe('resolveUniquePlayerName', () => {
  it('keeps the name when unused', () => {
    expect(resolveUniquePlayerName(['Alice'], 'Bob')).toBe('Bob');
  });

  it('adds (2) for the second player with the same name', () => {
    expect(resolveUniquePlayerName(['Alice'], 'Alice')).toBe('Alice (2)');
  });

  it('increments suffix until unique', () => {
    expect(resolveUniquePlayerName(['Alice', 'Alice (2)'], 'Alice')).toBe('Alice (3)');
  });

  it('deduplicates default guest names', () => {
    expect(resolveUniquePlayerName(['Guest'], 'Guest')).toBe('Guest (2)');
    expect(resolveUniquePlayerName(['Guest', 'Guest (2)'], 'Guest')).toBe('Guest (3)');
  });
});

describe('assignGroups', () => {
  it('splits players evenly across 2 groups by default', () => {
    const players = ['a', 'b', 'c', 'd'].map((id) => makePlayer(id, null));
    const groups = assignGroups(players, 2);
    expect(groups).toHaveLength(2);
    expect(groups[0].playerIds).toHaveLength(2);
    expect(groups[1].playerIds).toHaveLength(2);
    expect(groups[0].isInGroup).toBe(true);
  });

  it('supports 3 players across 2 groups (2 in, 1 out)', () => {
    const players = ['a', 'b', 'c'].map((id) => makePlayer(id, null));
    const groups = assignGroups(players, 2);
    expect(groups).toHaveLength(2);
    expect(groups[0].playerIds).toHaveLength(2);
    expect(groups[1].playerIds).toHaveLength(1);
    expect(groups[0].isInGroup).toBe(true);
  });

  it('supports 4 players across 3 groups', () => {
    const players = ['a', 'b', 'c', 'd'].map((id) => makePlayer(id, null));
    const groups = assignGroups(players, 3);
    expect(groups).toHaveLength(3);
    expect(groups[0].playerIds).toHaveLength(2);
  });

  it('rejects group counts that leave in group with fewer than 2 players', () => {
    const players = ['a', 'b', 'c'].map((id) => makePlayer(id, null));
    expect(() => assignGroups(players, 3)).toThrow(/In Group needs at least 2/);
  });
});

describe('movePlayerToGroup', () => {
  const groups: Group[] = [
    { id: 0, playerIds: ['a', 'b'], isInGroup: true },
    { id: 1, playerIds: ['c'], isInGroup: false },
    { id: 2, playerIds: ['d'], isInGroup: false },
  ];

  it('moves a player from In Group to an Out Group', () => {
    const result = movePlayerToGroup(groups, 'a', 1);
    expect(result.error).toBeUndefined();
    expect(result.groups.find((g) => g.isInGroup)?.playerIds).toEqual(['b']);
    expect(result.groups.find((g) => g.id === 1)?.playerIds).toEqual(['c', 'a']);
  });

  it('moves a player from an Out Group to In Group', () => {
    const result = movePlayerToGroup(groups, 'c', 'inGroup');
    expect(result.error).toBeUndefined();
    expect(result.groups.find((g) => g.isInGroup)?.playerIds).toEqual(['a', 'b', 'c']);
    expect(result.groups.find((g) => g.id === 1)?.playerIds).toEqual([]);
  });
});

describe('assignJoinedPlayerToGroup', () => {
  it('fills In Group when it has fewer than 2 players', () => {
    const groups: Group[] = [
      { id: 0, playerIds: ['a'], isInGroup: true },
      { id: 1, playerIds: ['b', 'c'], isInGroup: false },
    ];
    const next = assignJoinedPlayerToGroup(groups, 'd');
    expect(next.find((g) => g.isInGroup)?.playerIds).toEqual(['a', 'd']);
  });

  it('fills an empty Out Group when In Group already has 2+', () => {
    const groups: Group[] = [
      { id: 0, playerIds: ['a', 'b'], isInGroup: true },
      { id: 1, playerIds: ['c'], isInGroup: false },
      { id: 2, playerIds: [], isInGroup: false },
    ];
    const next = assignJoinedPlayerToGroup(groups, 'd');
    expect(next.find((g) => g.id === 2)?.playerIds).toEqual(['d']);
  });

  it('adds to In Group when all Out Groups are occupied', () => {
    const groups: Group[] = [
      { id: 0, playerIds: ['a', 'b'], isInGroup: true },
      { id: 1, playerIds: ['c'], isInGroup: false },
    ];
    const next = assignJoinedPlayerToGroup(groups, 'd');
    expect(next.find((g) => g.isInGroup)?.playerIds).toEqual(['a', 'b', 'd']);
  });
});

describe('calculateScores', () => {
  it('Rule 3: all In Group agree → +2 each', () => {
    const room = makeRoom(['Dog', 'Dog', 'Dog'], [['Cat'], ['Bird']]);
    const scores = calculateScores(room);
    expect(scores.get('in0')).toBe(2);
    expect(scores.get('in1')).toBe(2);
    expect(scores.get('in2')).toBe(2);
  });

  it('Rule 4: partial In Group agreement → +1 only for those who matched', () => {
    const room = makeRoom(['Dog', 'Dog', 'Cat'], [['Bird'], ['Fish']]);
    const scores = calculateScores(room);
    expect(scores.get('in0')).toBe(1);
    expect(scores.get('in1')).toBe(1);
    expect(scores.get('in2')).toBe(0);
  });

  it('Rule 4: no agreement in In Group → no In Group points', () => {
    const room = makeRoom(['Dog', 'Cat', 'Bird'], [['Fish'], ['Frog']]);
    const scores = calculateScores(room);
    expect(scores.get('in0')).toBe(0);
    expect(scores.get('in1')).toBe(0);
    expect(scores.get('in2')).toBe(0);
  });

  it('Rule 1: entire Out Group matches most popular In Group word → +2 each', () => {
    const room = makeRoom(['Dog', 'Cat', 'Bird'], [['Dog', 'Dog'], ['Fish', 'Frog']]);
    const scores = calculateScores(room);
    expect(scores.get('out0_0')).toBe(2);
    expect(scores.get('out0_1')).toBe(2);
    expect(scores.get('in0')).toBe(0);
  });

  it('Rule 2: Out Group matches/exceeds In Group agreement count → +1 each in that Out Group', () => {
    // In Group: 2 on Dog. Out Group: 2 of 3 on Dog (not all → Rule 1 skipped, Rule 2 applies)
    const room = makeRoom(['Dog', 'Dog', 'Cat'], [['Dog', 'Dog', 'Fish']]);
    const scores = calculateScores(room);
    expect(scores.get('out0_0')).toBe(1);
    expect(scores.get('out0_1')).toBe(1);
    expect(scores.get('out0_2')).toBe(1);
    expect(scores.get('in0')).toBe(0);
  });
});
