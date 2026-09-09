import { io, Socket } from 'socket.io-client';

import type {
  ClientRoomState,
  WordSet,
  LicenseInfo,
  LicenseCheckoutResponse,
  LicensePurchaseSummary,
  ChatMessage,
} from '@shared/types';



const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

const ACK_TIMEOUT_MS = 8000;

const SESSION_KEY = 'ingroups_player';



let socket: Socket | null = null;

let ackChain: Promise<unknown> = Promise.resolve();

let restorePromise: Promise<{ playerId: string; room: ClientRoomState } | null> | null = null;

let getTokenFn: (() => Promise<string | null>) | null = null;

const GUEST_FLAG = 'ingroups_guest';
const GUEST_ID_KEY = 'ingroups_guest_id';

const roomUpdateListeners = new Set<(room: ClientRoomState) => void>();
const gameClosedListeners = new Set<(data: { reason: string }) => void>();
const chatUpdateListeners = new Set<(messages: ChatMessage[]) => void>();
const reconnectListeners = new Set<() => void>();

let socketEventsBound = false;

function bindSocketEvents(s: Socket) {
  if (socketEventsBound) return;
  socketEventsBound = true;

  s.on('roomUpdate', (room: ClientRoomState) => {
    roomUpdateListeners.forEach((cb) => cb(room));
  });
  s.on('gameClosed', (data: { reason: string }) => {
    gameClosedListeners.forEach((cb) => cb(data));
  });
  s.on('chatUpdate', (messages: ChatMessage[]) => {
    chatUpdateListeners.forEach((cb) => cb(messages));
  });
  s.io.on('reconnect', () => {
    reconnectListeners.forEach((cb) => cb());
  });
}

function resetSocketEvents() {
  socketEventsBound = false;
}



export function isGuestMode(): boolean {
  if (sessionStorage.getItem(GUEST_FLAG) === '1') return true;
  if (localStorage.getItem(GUEST_FLAG) === '1') {
    sessionStorage.setItem(GUEST_FLAG, '1');
    localStorage.removeItem(GUEST_FLAG);
    localStorage.removeItem(GUEST_ID_KEY);
    return true;
  }
  return false;
}

function getGuestId(): string {
  let id = sessionStorage.getItem(GUEST_ID_KEY);
  if (!id || !id.startsWith('guest_')) {
    id = `guest_${crypto.randomUUID()}`;
    sessionStorage.setItem(GUEST_ID_KEY, id);
  }
  return id;
}

export function enableGuestMode(): void {
  getGuestId();
  sessionStorage.setItem(GUEST_FLAG, '1');
  localStorage.removeItem(GUEST_FLAG);
  localStorage.removeItem(GUEST_ID_KEY);
}

export function clearGuestMode(): void {
  sessionStorage.removeItem(GUEST_FLAG);
  sessionStorage.removeItem(GUEST_ID_KEY);
  localStorage.removeItem(GUEST_FLAG);
  localStorage.removeItem(GUEST_ID_KEY);
}

export function exitGuestMode(): void {
  clearGuestMode();
  resetAuth();
}



export function configureAuth(getToken: () => Promise<string | null>) {

  clearGuestMode();
  getTokenFn = getToken;

  if (socket) {

    socket.disconnect();

    socket = null;

  }

  resetSocketEvents();

}



export function configureGuestAuth(): void {

  getTokenFn = null;

  enableGuestMode();

  if (socket) {

    socket.disconnect();

    socket = null;

  }

  resetSocketEvents();

}



export function resetAuth() {

  getTokenFn = null;

  if (socket) {

    socket.disconnect();

    socket = null;

  }

  resetSocketEvents();

}



async function authPayload(): Promise<{ token?: string; guestId?: string }> {

  if (isGuestMode()) {

    return { guestId: getGuestId() };

  }

  if (!getTokenFn) {

    throw new Error('Not signed in');

  }

  const token = await getTokenFn();

  if (!token) {

    throw new Error('Not signed in');

  }

  return { token };

}



export function getSocket(): Socket {

  if (!socket) {

    throw new Error('Socket not connected — sign in first');

  }

  return socket;

}



export function saveSession(playerId: string, roomCode: string) {

  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ playerId, roomCode }));

}



export function clearSession() {

  sessionStorage.removeItem(SESSION_KEY);

  localStorage.removeItem(SESSION_KEY);

}



export function readSession(): { playerId: string; roomCode: string } | null {

  const raw = sessionStorage.getItem(SESSION_KEY);

  if (!raw) return null;

  try {

    return JSON.parse(raw);

  } catch {

    clearSession();

    return null;

  }

}



async function ensureSocket(): Promise<Socket> {

  const auth = await authPayload();



  if (!socket) {

    socket = io(SERVER_URL || undefined, {

      autoConnect: false,

      transports: ['websocket', 'polling'],

      auth,

    });

    bindSocketEvents(socket);

  } else {

    socket.auth = auth;

  }



  if (socket.connected) return socket;



  return new Promise((resolve, reject) => {

    const timeout = setTimeout(() => {

      cleanup();

      reject(new Error('Connection timeout — is the server running?'));

    }, ACK_TIMEOUT_MS);



    const onConnect = () => {

      cleanup();

      resolve(socket!);

    };

    const onError = (err: Error) => {

      cleanup();

      reject(new Error(err.message || 'Connection failed — is the server running?'));

    };

    const cleanup = () => {

      clearTimeout(timeout);

      socket!.off('connect', onConnect);

      socket!.off('connect_error', onError);

    };



    socket!.on('connect', onConnect);

    socket!.on('connect_error', onError);

    socket!.connect();

  });

}



function emitWithAck<T>(event: string, payload?: unknown): Promise<T> {

  const run = () =>

    ensureSocket().then(

      (s) =>

        new Promise<T>((resolve, reject) => {

          const timeout = setTimeout(() => reject(new Error('Request timeout')), ACK_TIMEOUT_MS);

          const handler = (res: T) => {

            clearTimeout(timeout);

            resolve(res);

          };

          s.emit(event, payload ?? null, handler);

        })

    );



  const result = ackChain.then(run, run);

  ackChain = result.catch(() => {});

  return result;

}



function isSessionGoneError(error: unknown): boolean {

  const msg = error instanceof Error ? error.message : String(error);

  return msg.includes('Room not found') || msg.includes('Player not found') || msg.includes('Not authorized');

}



export function onReconnect(cb: () => void): () => void {
  reconnectListeners.add(cb);
  return () => {
    reconnectListeners.delete(cb);
  };
}

export function createRoom(name: string): Promise<{ playerId: string; room: ClientRoomState }> {

  return emitWithAck<{ success: boolean; playerId?: string; room?: ClientRoomState; error?: string }>(

    'createRoom',

    { name }

  ).then((res) => {

    if (res.success && res.playerId && res.room) {

      saveSession(res.playerId, res.room.code);

      return { playerId: res.playerId, room: res.room };

    }

    throw new Error(res.error ?? 'Failed to create room');

  });

}



export function joinRoom(code: string, name: string): Promise<{ playerId: string; room: ClientRoomState }> {

  return emitWithAck<{ success: boolean; playerId?: string; room?: ClientRoomState; error?: string }>(

    'joinRoom',

    { code, name }

  ).then((res) => {

    if (res.success && res.playerId && res.room) {

      saveSession(res.playerId, res.room.code);

      return { playerId: res.playerId, room: res.room };

    }

    throw new Error(res.error ?? 'Failed to join room');

  });

}



export function rejoinRoom(code: string, playerId: string): Promise<ClientRoomState> {

  return emitWithAck<{ success: boolean; room?: ClientRoomState; error?: string }>(

    'rejoinRoom',

    { code, playerId }

  ).then((res) => {

    if (res.success && res.room) return res.room;

    throw new Error(res.error ?? 'Failed to rejoin');

  });

}



export function restoreSession(): Promise<{ playerId: string; room: ClientRoomState } | null> {

  const stored = readSession();

  if (!stored) return Promise.resolve(null);

  if (!restorePromise) {

    restorePromise = rejoinRoom(stored.roomCode, stored.playerId)

      .then((room) => ({ playerId: stored.playerId, room }))

      .catch((err) => {

        if (isSessionGoneError(err)) clearSession();

        throw err;

      })

      .finally(() => {

        restorePromise = null;

      });

  }

  return restorePromise;

}



export function onRoomUpdate(cb: (room: ClientRoomState) => void): () => void {
  roomUpdateListeners.add(cb);
  return () => {
    roomUpdateListeners.delete(cb);
  };
}

export function onGameClosed(cb: (data: { reason: string }) => void): () => void {
  gameClosedListeners.add(cb);
  return () => {
    gameClosedListeners.delete(cb);
  };
}

export function leaveGame(playerId: string, roomCode: string): void {

  if (!socket?.connected) return;

  socket.emit('leaveGame', { playerId, roomCode });

}



export function updateSettings(settings: {
  numGroups?: number;
  wordSetId?: string;
  wordSetName?: string;
  roundDurationMinutes?: number;
}) {

  getSocket().emit('updateSettings', settings);

}



export function startGame() {

  getSocket().emit('startGame');

}



export function startRound() {

  getSocket().emit('startRound');

}



export function endRound() {

  getSocket().emit('endRound');

}



export function submitGuess(guess: string | null) {

  getSocket().emit('submitGuess', { guess });

}



export function sendChat(text: string, playerId: string, roomCode: string) {

  getSocket().emit('sendChat', { text, playerId, roomCode });

}



export function onChatUpdate(cb: (messages: ChatMessage[]) => void): () => void {
  chatUpdateListeners.add(cb);
  return () => {
    chatUpdateListeners.delete(cb);
  };
}

export function shuffleGroups(): Promise<{ success: boolean; error?: string }> {

  return emitWithAck('shuffleGroups');

}



export function shiftGroups() {

  getSocket().emit('shiftGroups');

}



export function resetScores() {

  getSocket().emit('resetScores');

}



export function removePlayer(playerId: string): Promise<{ success: boolean; error?: string }> {
  return ensureSocket().then(
    (s) =>
      new Promise((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error('Request timeout — is the game server running the latest version?')),
          ACK_TIMEOUT_MS
        );
        s.emit('removePlayer', { playerId }, (res: { success: boolean; error?: string } | undefined) => {
          clearTimeout(timeout);
          if (!res) {
            reject(new Error('Request timeout — is the game server running the latest version?'));
            return;
          }
          resolve(res);
        });
      })
  );
}

export function movePlayer(
  playerId: string,
  destination: 'inGroup' | number
): Promise<{ success: boolean; error?: string }> {
  return ensureSocket().then(
    (s) =>
      new Promise((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error('Request timeout — is the game server running the latest version?')),
          ACK_TIMEOUT_MS
        );
        const payload =
          destination === 'inGroup'
            ? { playerId, destination: 'inGroup' as const }
            : { playerId, outGroupId: destination };
        s.emit('movePlayer', payload, (res: { success: boolean; error?: string } | undefined) => {
          clearTimeout(timeout);
          if (!res) {
            reject(new Error('Request timeout — is the game server running the latest version?'));
            return;
          }
          resolve(res);
        });
      })
  );
}



export function getWordSets(): Promise<WordSet[]> {

  return emitWithAck<WordSet[]>('getWordSets');

}



export function saveWordSet(id: string, name: string, words: string[]): Promise<{ success: boolean; error?: string }> {

  return emitWithAck('saveWordSet', { id, name, words });

}



export function deleteWordSet(id: string): Promise<{ success: boolean; error?: string }> {

  return emitWithAck('deleteWordSet', { id });

}



export function activateLicense(key: string): Promise<{ valid: boolean; error?: string }> {

  return emitWithAck('activateLicense', { key });

}



export function getLicense(): Promise<LicenseInfo | null> {

  return emitWithAck<LicenseInfo | null>('getLicense');

}

export interface LicenseShopConfig {
  enabled: boolean;
  unitPriceCents: number;
  minQuantity: number;
  maxQuantity: number;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const auth = await authPayload();
  if (!auth.token) {
    throw new Error('Not signed in');
  }

  const res = await fetch(`${SERVER_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.token}`,
      ...(init?.headers ?? {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Request failed');
  }
  return data as T;
}

export async function getLicenseShopConfig(): Promise<LicenseShopConfig> {
  const res = await fetch(`${SERVER_URL}/api/licenses/config`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Failed to load shop');
  }
  return data as LicenseShopConfig;
}

export function getLicensePurchaseSummary(): Promise<LicensePurchaseSummary> {
  return apiRequest<LicensePurchaseSummary>('/api/licenses/summary');
}

export function createLicenseCheckout(quantity: number): Promise<LicenseCheckoutResponse> {
  return apiRequest<LicenseCheckoutResponse>('/api/licenses/checkout', {
    method: 'POST',
    body: JSON.stringify({ quantity }),
  });
}

export function confirmLicensePurchase(sessionId: string): Promise<LicensePurchaseSummary> {
  return apiRequest<LicensePurchaseSummary>('/api/licenses/confirm', {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  });
}


