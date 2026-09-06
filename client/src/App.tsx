import { useState, useEffect, useCallback, useRef } from 'react';
import type { ClientRoomState } from '@shared/types';
import {
  onRoomUpdate,
  onGameClosed,
  restoreSession,
  rejoinRoom,
  leaveGame,
  clearSession,
  readSession,
  onReconnect,
  onChatUpdate,
} from './api';
import { LogoMark } from './components/Logo';
import { HeaderAuth } from './components/HeaderAuth';
import { ConfirmModal } from './components/UI';
import { LandingScreen } from './screens/LandingScreen';
import { StartScreen } from './screens/StartScreen';
import { GameScreen } from './screens/GameScreen';
import { WordSetScreen } from './screens/WordSetScreen';
import { LicenseScreen } from './screens/LicenseScreen';
import { CreateWordSetScreen } from './screens/CreateWordSetScreen';
import { ChatPanel } from './components/ChatPanel';

type Screen = 'start' | 'game' | 'wordSet';
type LandingView = 'home' | 'license' | 'createWordSet';

function screenForRoom(room: ClientRoomState): Screen {
  if (room.groups.length > 0 || room.phase === 'playing' || room.phase === 'roundEnd') {
    return 'game';
  }
  return 'start';
}

export default function App() {
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [room, setRoom] = useState<ClientRoomState | null>(null);
  const [screen, setScreen] = useState<Screen>('start');
  const [initialized, setInitialized] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [closedMessage, setClosedMessage] = useState<string | null>(null);
  const [landingView, setLandingView] = useState<LandingView>('home');
  const inGameRef = useRef(false);
  const sessionActiveRef = useRef(false);

  inGameRef.current = playerId !== null && room !== null;
  sessionActiveRef.current = playerId !== null && room !== null;

  const exitToLanding = useCallback((message?: string) => {
    sessionActiveRef.current = false;
    clearSession();
    setPlayerId(null);
    setRoom(null);
    setScreen('start');
    setLandingView('home');
    setShowExitConfirm(false);
    if (message) setClosedMessage(message);
  }, []);

  const applySession = useCallback((pid: string, sessionRoom: ClientRoomState) => {
    sessionActiveRef.current = true;
    setPlayerId(pid);
    setRoom(sessionRoom);
    setScreen(screenForRoom(sessionRoom));
  }, []);

  const handleRoomUpdate = useCallback((updated: ClientRoomState) => {
    if (!sessionActiveRef.current) return;
    setRoom((prev) => ({
      ...updated,
      chatMessages: updated.chatMessages ?? prev?.chatMessages ?? [],
    }));
    setScreen(screenForRoom(updated));
  }, []);

  const handleChatUpdate = useCallback((messages: ClientRoomState['chatMessages']) => {
    if (!sessionActiveRef.current) return;
    setRoom((prev) => (prev ? { ...prev, chatMessages: messages } : prev));
  }, []);

  useEffect(() => {
    localStorage.removeItem('ingroups_player');
    restoreSession()
      .then((session) => {
        if (session) applySession(session.playerId, session.room);
      })
      .catch((err) => {
        if (err instanceof Error && (err.message.includes('Room not found') || err.message.includes('Player not found') || err.message.includes('Not authorized'))) {
          clearSession();
        }
      })
      .finally(() => setInitialized(true));
  }, [applySession]);

  useEffect(() => {
    if (!playerId) return;
    const unsub = onRoomUpdate(handleRoomUpdate);
    return unsub;
  }, [playerId, handleRoomUpdate]);

  useEffect(() => {
    if (!playerId) return;
    const unsub = onGameClosed(({ reason }) => exitToLanding(reason));
    return unsub;
  }, [playerId, exitToLanding]);

  useEffect(() => {
    if (!playerId) return;
    const unsub = onChatUpdate(handleChatUpdate);
    return unsub;
  }, [playerId, handleChatUpdate]);

  useEffect(() => {
    if (!playerId) return;
    const unsub = onReconnect(async () => {
      if (!inGameRef.current) return;
      const stored = readSession();
      if (!stored) return;
      try {
        const sessionRoom = await rejoinRoom(stored.roomCode, stored.playerId);
        applySession(stored.playerId, sessionRoom);
      } catch (err) {
        if (err instanceof Error && (err.message.includes('Room not found') || err.message.includes('Player not found'))) {
          exitToLanding('Session expired.');
        }
      }
    });
    return unsub;
  }, [playerId, applySession, exitToLanding]);

  const handleExit = () => {
    const pid = playerId;
    const code = room?.code;
    exitToLanding();
    if (pid && code) {
      leaveGame(pid, code);
    }
  };

  const handleEnter = (pid: string, _code: string, initialRoom?: ClientRoomState) => {
    setClosedMessage(null);
    setLandingView('home');
    sessionActiveRef.current = true;
    setPlayerId(pid);
    if (initialRoom) {
      setRoom(initialRoom);
      setScreen(screenForRoom(initialRoom));
    } else {
      setScreen('start');
    }
  };

  if (!initialized) {
    return (
      <div className="app">
        <main className="app-content auth-screen">
          <p className="muted">Loading…</p>
        </main>
      </div>
    );
  }

  if (!playerId || !room) {
    return (
      <div className="app">
        {closedMessage && (
          <div className="closed-banner">{closedMessage}</div>
        )}
        <header className="app-header">
          <div className="app-header-left">
            <LogoMark size={28} />
            <span className="app-title">InGroups</span>
          </div>
          <div className="app-header-right">
            <HeaderAuth />
          </div>
        </header>
        <main className="app-content">
          {landingView === 'license' && (
            <LicenseScreen onBack={() => setLandingView('home')} />
          )}
          {landingView === 'createWordSet' && (
            <CreateWordSetScreen onBack={() => setLandingView('home')} />
          )}
          {landingView === 'home' && (
            <LandingScreen
              onEnter={handleEnter}
              onNavigate={(s) => setLandingView(s as LandingView)}
            />
          )}
        </main>
      </div>
    );
  }

  const isHost = room.myPlayerId === room.hostId;

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-left">
          <LogoMark size={28} />
          <span className="app-title">InGroups</span>
        </div>
        <div className="app-header-right">
          <button type="button" className="exit-btn" onClick={() => isHost ? setShowExitConfirm(true) : handleExit()}>
            {isHost ? 'Exit Game' : 'Leave'}
          </button>
          <HeaderAuth />
        </div>
      </header>

      <main className="app-content">
        {screen === 'start' && (
          <StartScreen room={room} />
        )}
        {screen === 'game' && (
          <GameScreen room={room} onNavigate={(s) => setScreen(s as Screen)} />
        )}
        {screen === 'wordSet' && (
          <WordSetScreen
            room={room}
            onBack={() => setScreen('game')}
          />
        )}
      </main>

      {showExitConfirm && (
        <ConfirmModal
          message="Exit the game? This will end the session for all players."
          onConfirm={handleExit}
          onCancel={() => setShowExitConfirm(false)}
        />
      )}

      {screen === 'game' && room.phase === 'playing' && (
        <ChatPanel
          messages={room.chatMessages ?? []}
          canSend={room.myRole === 'inGroup'}
          myPlayerId={room.myPlayerId}
          roomCode={room.code}
        />
      )}
    </div>
  );
}
