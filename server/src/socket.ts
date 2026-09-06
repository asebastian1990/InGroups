import type { Server, Socket } from 'socket.io';
import type { ClientRoomState, ClientPlayer, WordSet } from '../../shared/types.js';
import {
  createRoom,
  assignGroups,
  validateGroupCount,
  resolveUniquePlayerName,
  hasGroupBelowMinSize,
  shiftGroups,
  selectRoundWords,
  calculateScores,
  allPlayersGuessed,
  getRemainingTime,
  isRoundExpired,
  ROUND_DURATION,
} from './game.js';
import {
  getWordSets,
  getWordSetWords,
  saveCustomWordSet,
  deleteCustomWordSet,
  validateLicense,
  getPlayerLicense,
} from './db.js';
import { authenticateConnection, getPlayerId, isGuestSocket } from './auth.js';
import type { RoomState, Player } from '../../shared/types.js';
import { MIN_IN_GROUP_SIZE, MIN_PLAYERS } from '../../shared/types.js';
import { v4 as uuidv4 } from 'uuid';

const rooms = new Map<string, RoomState>();
const playerRooms = new Map<string, string>();
const timers = new Map<string, ReturnType<typeof setInterval>>();
const disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

const DISCONNECT_GRACE_MS = 45_000;

function clearDisconnectTimer(playerId: string) {
  const timer = disconnectTimers.get(playerId);
  if (timer) {
    clearTimeout(timer);
    disconnectTimers.delete(playerId);
  }
}

function scheduleDisconnectedPlayerCleanup(io: Server, playerId: string) {
  clearDisconnectTimer(playerId);
  const timer = setTimeout(() => {
    disconnectTimers.delete(playerId);
    if (playerRooms.has(playerId)) return;

    for (const room of rooms.values()) {
      if (!room.players.some((p) => p.id === playerId)) continue;
      if (room.hostId === playerId) {
        closeRoom(io, room, 'Host disconnected.');
      } else {
        removePlayerFromRoom(io, room, playerId);
      }
      break;
    }
  }, DISCONNECT_GRACE_MS);
  disconnectTimers.set(playerId, timer);
}

function toClientState(room: RoomState, playerId: string): ClientRoomState {
  const myGroup = room.groups.find((g) => g.playerIds.includes(playerId));
  const players: ClientPlayer[] = room.players.map((p) => ({
    ...p,
    groupId: room.groups.find((g) => g.playerIds.includes(p.id))?.id ?? null,
    isInGroup: room.groups.find((g) => g.playerIds.includes(p.id))?.isInGroup ?? false,
  }));

  return {
    code: room.code,
    phase: room.phase,
    numGroups: room.numGroups,
    wordSetId: room.wordSetId,
    wordSetName: room.wordSetName,
    players,
    groups: room.groups,
    roundWords: room.roundWords,
    roundTimer: room.roundTimer,
    hostId: room.hostId,
    waitingForHost: room.waitingForHost,
    myPlayerId: playerId,
    myRole: myGroup ? (myGroup.isInGroup ? 'inGroup' : 'outGroup') : null,
    myGroupId: myGroup?.id ?? null,
    chatMessages: room.chatMessages,
    needsReshuffle: room.needsReshuffle ?? false,
    roundNotice: room.roundNotice ?? null,
  };
}

function broadcastRoom(io: Server, room: RoomState) {
  for (const player of room.players) {
    const socketId = playerRooms.get(player.id);
    if (socketId) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit('roomUpdate', toClientState(room, player.id));
      }
    }
  }
}

function clearTimer(code: string) {
  const timer = timers.get(code);
  if (timer) {
    clearInterval(timer);
    timers.delete(code);
  }
}

function closeRoom(io: Server, room: RoomState, reason: string) {
  clearTimer(room.code);
  io.to(room.code).emit('gameClosed', { reason });
  for (const player of room.players) {
    playerRooms.delete(player.id);
  }
  rooms.delete(room.code);
}

function removePlayerFromRoom(io: Server, room: RoomState, playerId: string) {
  const wasPlaying = room.phase === 'playing';
  room.players = room.players.filter((p) => p.id !== playerId);
  for (const group of room.groups) {
    group.playerIds = group.playerIds.filter((id) => id !== playerId);
  }
  playerRooms.delete(playerId);
  if (room.players.length === 0) {
    clearTimer(room.code);
    rooms.delete(room.code);
    return;
  }
  if (wasPlaying && hasGroupBelowMinSize(room.groups)) {
    abortRoundNoScore(io, room);
    return;
  }
  broadcastRoom(io, room);
}

function abortRoundNoScore(io: Server, room: RoomState) {
  clearTimer(room.code);
  room.players.forEach((p) => {
    p.guess = null;
    p.roundPoints = 0;
  });
  room.phase = 'roundEnd';
  room.roundTimer = 0;
  room.roundWords = [];
  room.chatMessages = [];
  room.roundStartedAt = null;
  room.waitingForHost = true;
  room.needsReshuffle = true;
  room.roundNotice = 'Round ended — a player left. No points awarded. Shuffle groups before starting the next round.';
  broadcastRoom(io, room);
}

function startRoundTimer(io: Server, room: RoomState) {
  clearTimer(room.code);
  const timer = setInterval(() => {
    const r = rooms.get(room.code);
    if (!r || r.phase !== 'playing') {
      clearTimer(room.code);
      return;
    }
    r.roundTimer = getRemainingTime(r);
    if (isRoundExpired(r) || allPlayersGuessed(r)) {
      endRound(io, r);
    } else {
      broadcastRoom(io, r);
    }
  }, 1000);
  timers.set(room.code, timer);
}

function endRound(io: Server, room: RoomState) {
  clearTimer(room.code);
  const points = calculateScores(room);
  room.players.forEach((p) => {
    const pts = points.get(p.id) ?? 0;
    p.roundPoints = pts;
    p.score += pts;
  });
  room.phase = 'roundEnd';
  room.roundTimer = 0;
  room.waitingForHost = true;
  room.roundNotice = null;
  broadcastRoom(io, room);
}

export function setupSocketHandlers(io: Server) {
  io.use(async (socket, next) => {
    const handshakeAuth = socket.handshake.auth as { token?: string; guestId?: string } | undefined;
    const auth = await authenticateConnection({
      token: handshakeAuth?.token,
      guestId: handshakeAuth?.guestId,
    });
    if (!auth) {
      next(new Error('Unauthorized'));
      return;
    }
    socket.data.auth = auth;
    next();
  });

  io.on('connection', (socket: Socket) => {
    const playerAuthId = getPlayerId(socket);
    if (!playerAuthId) {
      socket.disconnect();
      return;
    }

    let currentPlayerId: string | null = playerAuthId;

    socket.on('createRoom', ({ name }: { name: string }, cb) => {
      const playerId = playerAuthId;
      currentPlayerId = playerId;
      const room = createRoom(name, playerId);
      rooms.set(room.code, room);
      playerRooms.set(playerId, socket.id);
      socket.join(room.code);
      cb({ success: true, playerId, room: toClientState(room, playerId) });
    });

    socket.on('joinRoom', ({ code, name }: { code: string; name: string }, cb) => {
      const room = rooms.get(code.toUpperCase());
      if (!room) {
        cb({ success: false, error: 'Room not found' });
        return;
      }
      if (room.phase !== 'lobby' && room.phase !== 'roundEnd') {
        cb({ success: false, error: 'Game already in progress' });
        return;
      }
      const playerId = playerAuthId;
      currentPlayerId = playerId;

      const existing = room.players.find((p) => p.id === playerId);
      if (existing) {
        existing.name = resolveUniquePlayerName(
          room.players.filter((p) => p.id !== playerId).map((p) => p.name),
          name
        );
        clearDisconnectTimer(playerId);
        playerRooms.set(playerId, socket.id);
        socket.join(room.code);
        broadcastRoom(io, room);
        cb({ success: true, playerId, room: toClientState(room, playerId) });
        return;
      }

      const uniqueName = resolveUniquePlayerName(
        room.players.map((p) => p.name),
        name
      );
      room.players.push({
        id: playerId,
        name: uniqueName,
        score: 0,
        isHost: false,
        guess: null,
        roundPoints: 0,
      });
      playerRooms.set(playerId, socket.id);
      socket.join(room.code);
      broadcastRoom(io, room);
      cb({ success: true, playerId, room: toClientState(room, playerId) });
    });

    socket.on('rejoinRoom', ({ code, playerId }: { code: string; playerId: string }, cb) => {
      if (playerId !== playerAuthId) {
        cb({ success: false, error: 'Not authorized' });
        return;
      }
      const room = rooms.get(code.toUpperCase());
      if (!room) {
        cb({ success: false, error: 'Room not found' });
        return;
      }
      const player = room.players.find((p) => p.id === playerId);
      if (!player) {
        cb({ success: false, error: 'Player not found' });
        return;
      }
      currentPlayerId = playerId;
      clearDisconnectTimer(playerId);
      playerRooms.set(playerId, socket.id);
      socket.join(room.code);
      cb({ success: true, room: toClientState(room, playerId) });
    });

    socket.on('updateSettings', ({ numGroups, wordSetId, wordSetName }) => {
      const room = getRoomForPlayer(currentPlayerId);
      if (!room || room.hostId !== currentPlayerId) return;
      if (numGroups !== undefined) {
        const val = Math.max(2, numGroups);
        if (validateGroupCount(room.players.length, val)) return;
        room.numGroups = val;
      }
      if (wordSetId) room.wordSetId = wordSetId;
      if (wordSetName) room.wordSetName = wordSetName;
      broadcastRoom(io, room);
    });

    socket.on('startGame', () => {
      const room = getRoomForPlayer(currentPlayerId);
      if (!room || room.hostId !== currentPlayerId) return;
      if (room.players.length < MIN_PLAYERS) return;
      const groupError = validateGroupCount(room.players.length, room.numGroups);
      if (groupError) return;
      room.groups = assignGroups(room.players, room.numGroups);
      room.phase = 'lobby';
      room.waitingForHost = true;
      room.needsReshuffle = false;
      room.roundNotice = null;
      broadcastRoom(io, room);
    });

    socket.on('startRound', async () => {
      const room = getRoomForPlayer(currentPlayerId);
      if (!room || room.hostId !== currentPlayerId) return;
      if (room.needsReshuffle || hasGroupBelowMinSize(room.groups)) return;
      room.players.forEach((p) => {
        p.guess = null;
        p.roundPoints = 0;
      });
      const customWords = await getWordSetWords(room.wordSetId, room.hostId);
      room.roundWords = selectRoundWords(room.wordSetId, customWords ?? undefined);
      room.phase = 'playing';
      room.chatMessages = [];
      room.roundStartedAt = Date.now();
      room.roundTimer = ROUND_DURATION;
      room.waitingForHost = false;
      room.needsReshuffle = false;
      room.roundNotice = null;
      startRoundTimer(io, room);
      broadcastRoom(io, room);
    });

    socket.on('endRound', () => {
      const room = getRoomForPlayer(currentPlayerId);
      if (!room || room.hostId !== currentPlayerId) return;
      if (room.phase !== 'playing') return;
      endRound(io, room);
    });

    socket.on('submitGuess', ({ guess }: { guess: string | null }) => {
      const room = getRoomForPlayer(currentPlayerId);
      if (!room || room.phase !== 'playing' || !currentPlayerId) return;
      const player = room.players.find((p) => p.id === currentPlayerId);
      if (!player) return;
      player.guess = guess;
      if (allPlayersGuessed(room)) {
        endRound(io, room);
      } else {
        broadcastRoom(io, room);
      }
    });

    socket.on('sendChat', ({ text, playerId, roomCode }: { text: string; playerId: string; roomCode: string }) => {
      if (!playerId || !roomCode || playerId !== playerAuthId) return;

      currentPlayerId = playerId;
      playerRooms.set(playerId, socket.id);
      const room = rooms.get(roomCode.toUpperCase());
      if (!room) return;
      if (room.phase !== 'playing') return;

      socket.join(room.code);

      const inGroup = room.groups.find((g) => g.isInGroup);
      if (!inGroup?.playerIds.includes(playerId)) return;

      const trimmed = text?.trim();
      if (!trimmed || trimmed.length > 500) return;

      const player = room.players.find((p) => p.id === playerId);
      if (!player) return;

      if (!room.chatMessages) room.chatMessages = [];

      const message = {
        id: uuidv4(),
        playerId,
        playerName: player.name,
        text: trimmed,
        timestamp: Date.now(),
      };
      room.chatMessages.push(message);
      if (room.chatMessages.length > 100) {
        room.chatMessages = room.chatMessages.slice(-100);
      }

      io.to(room.code).emit('chatUpdate', [...room.chatMessages]);
      broadcastRoom(io, room);
    });

    socket.on('shuffleGroups', (data, cb) => {
      const ack = typeof data === 'function' ? data : typeof cb === 'function' ? cb : () => {};
      const room = getRoomForPlayer(currentPlayerId);
      if (!room || room.hostId !== currentPlayerId) {
        ack({ success: false, error: 'Not authorized' });
        return;
      }
      const groupError = validateGroupCount(room.players.length, room.numGroups);
      if (groupError) {
        ack({ success: false, error: groupError });
        return;
      }
      try {
        room.groups = assignGroups(room.players, room.numGroups);
      } catch (err) {
        ack({ success: false, error: err instanceof Error ? err.message : 'Failed to shuffle groups' });
        return;
      }
      room.needsReshuffle = false;
      room.roundNotice = null;
      broadcastRoom(io, room);
      ack({ success: true });
    });

    socket.on('shiftGroups', () => {
      const room = getRoomForPlayer(currentPlayerId);
      if (!room || room.hostId !== currentPlayerId) return;
      room.groups = shiftGroups(room.groups);
      broadcastRoom(io, room);
    });

    socket.on('resetScores', () => {
      const room = getRoomForPlayer(currentPlayerId);
      if (!room || room.hostId !== currentPlayerId) return;
      room.players.forEach((p) => {
        p.score = 0;
        p.roundPoints = 0;
      });
      broadcastRoom(io, room);
    });

    socket.on('getWordSets', async (_data, cb) => {
      const ack = typeof cb === 'function' ? cb : () => {};
      try {
        if (isGuestSocket(socket)) {
          ack(await getWordSets(false));
          return;
        }
        const license = await getPlayerLicense(playerAuthId);
        ack(await getWordSets(!!license, playerAuthId));
      } catch (err) {
        console.error('getWordSets error:', err);
        ack([]);
      }
    });

    socket.on('saveWordSet', async (data: { id: string; name: string; words: string[] }, cb) => {
      try {
        if (isGuestSocket(socket)) {
          cb({ success: false, error: 'Sign in to create custom word sets.' });
          return;
        }
        const license = await getPlayerLicense(playerAuthId);
        if (!license) {
          cb({ success: false, error: 'License required' });
          return;
        }
        if (data.words.length < 20) {
          cb({ success: false, error: 'Minimum 20 words required' });
          return;
        }
        await saveCustomWordSet(data.id || uuidv4(), data.name, data.words, playerAuthId);
        cb({ success: true });
      } catch (err) {
        console.error('saveWordSet error:', err);
        cb({ success: false, error: 'Failed to save word set' });
      }
    });

    socket.on('deleteWordSet', async (data: { id: string }, cb) => {
      try {
        if (isGuestSocket(socket)) {
          cb({ success: false, error: 'Sign in to manage custom word sets.' });
          return;
        }
        await deleteCustomWordSet(data.id, playerAuthId);
        cb({ success: true });
      } catch (err) {
        console.error('deleteWordSet error:', err);
        cb({ success: false, error: 'Failed to delete word set' });
      }
    });

    socket.on('activateLicense', async (data: { key: string }, cb) => {
      try {
        if (isGuestSocket(socket)) {
          cb({ valid: false, error: 'Sign in to activate a license.' });
          return;
        }
        cb(await validateLicense(data.key, playerAuthId));
      } catch (err) {
        console.error('activateLicense error:', err);
        cb({ valid: false, error: 'Failed to activate license' });
      }
    });

    socket.on('getLicense', async (_data, cb) => {
      const ack = typeof cb === 'function' ? cb : () => {};
      try {
        if (isGuestSocket(socket)) {
          ack(null);
          return;
        }
        ack(await getPlayerLicense(playerAuthId));
      } catch (err) {
        console.error('getLicense error:', err);
        ack(null);
      }
    });

    socket.on('leaveGame', (data, cb) => {
      let playerId = currentPlayerId;
      let roomCode: string | null = null;
      let ack = cb;

      if (typeof data === 'function') {
        ack = data;
      } else if (data && typeof data === 'object') {
        playerId = data.playerId ?? playerId;
        roomCode = data.roomCode ?? null;
      }

      const respond = typeof ack === 'function' ? ack : () => {};

      if (!playerId) {
        respond({ success: true });
        return;
      }

      const room = roomCode
        ? rooms.get(roomCode.toUpperCase())
        : getRoomForPlayer(playerId);

      if (!room || !room.players.some((p) => p.id === playerId)) {
        respond({ success: true });
        return;
      }

      clearDisconnectTimer(playerId);
      const isHost = room.hostId === playerId;
      if (isHost) {
        closeRoom(io, room, 'The host has ended the game.');
      } else {
        removePlayerFromRoom(io, room, playerId);
      }

      if (currentPlayerId === playerId) {
        socket.leave(room.code);
        currentPlayerId = null;
      }
      respond({ success: true });
    });

    socket.on('disconnect', () => {
      if (!currentPlayerId) return;
      playerRooms.delete(currentPlayerId);

      const room = getRoomForPlayer(currentPlayerId);
      if (room?.phase === 'playing') {
        clearDisconnectTimer(currentPlayerId);
        if (room.hostId === currentPlayerId) {
          closeRoom(io, room, 'Host disconnected.');
        } else {
          removePlayerFromRoom(io, room, currentPlayerId);
        }
        return;
      }

      scheduleDisconnectedPlayerCleanup(io, currentPlayerId);
    });

    function getRoomForPlayer(playerId: string | null): RoomState | undefined {
      if (!playerId) return undefined;
      for (const room of rooms.values()) {
        if (room.players.some((p) => p.id === playerId)) return room;
      }
      return undefined;
    }
  });
}
