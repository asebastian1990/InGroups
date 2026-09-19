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
  isGuestMode,
} from './api';
import { LogoMark } from './components/Logo';
import { HeaderAuth } from './components/HeaderAuth';
import { ConfirmModal, HowToPlayModal } from './components/UI';
import { LandingScreen } from './screens/LandingScreen';
import { StartScreen } from './screens/StartScreen';
import { GameScreen } from './screens/GameScreen';
import { WordSetScreen } from './screens/WordSetScreen';
import { LicenseScreen } from './screens/LicenseScreen';
import { CreateWordSetScreen } from './screens/CreateWordSetScreen';
import { ViewWordSetsScreen } from './screens/ViewWordSetsScreen';
import { ChatPanel } from './components/ChatPanel';
import { useTeamsEmbed, useTeamsProfile } from './teams/TeamsEmbedContext';

type Screen = 'start' | 'game' | 'wordSet' | 'viewWordSets';
type LandingView = 'home' | 'license' | 'createWordSet' | 'viewWordSets';

function readLicenseReturnParams() {
  const params = new URLSearchParams(window.location.search);
  const purchase = params.get('purchase');
  return {
    openLicense: params.get('view') === 'license',
    purchaseStatus:
      purchase === 'success' ? ('success' as const)
      : purchase === 'cancelled' ? ('cancelled' as const)
      : null,
    sessionId: params.get('session_id'),
  };
}

function screenForRoom(room: ClientRoomState): Screen {
  if (
    room.groups.length > 0 ||
    room.phase === 'playing' ||
    room.phase === 'roundEnd' ||
    room.phase === 'finished'
  ) {
    return 'game';
  }
  return 'start';
}

export default function App() {
  const teamsEmbed = useTeamsEmbed();
  const teamsProfile = useTeamsProfile();
  const teamsGuestOnly = teamsEmbed && !teamsProfile.signedInWithTeams;
  const initialLicenseReturn = readLicenseReturnParams();
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [room, setRoom] = useState<ClientRoomState | null>(null);
  const [screen, setScreen] = useState<Screen>('start');
  const [initialized, setInitialized] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [closedMessage, setClosedMessage] = useState<string | null>(null);
  const [landingView, setLandingView] = useState<LandingView>(
    initialLicenseReturn.openLicense ? 'license' : 'home'
  );
  const [licenseReturn, setLicenseReturn] = useState(initialLicenseReturn);
  const [lobbyNameNotice, setLobbyNameNotice] = useState<string | null>(null);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
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
    setLobbyNameNotice(null);
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
    if (teamsEmbed && landingView !== 'home' && landingView !== 'viewWordSets') {
      setLandingView('home');
    }
  }, [teamsEmbed, landingView]);

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

  const handleEnter = (pid: string, _code: string, initialRoom?: ClientRoomState, requestedName?: string) => {
    setClosedMessage(null);
    setLandingView('home');
    sessionActiveRef.current = true;
    setPlayerId(pid);
    if (initialRoom) {
      const me = initialRoom.players.find((p) => p.id === pid);
      if (me && requestedName && me.name !== requestedName) {
        setLobbyNameNotice(`You're listed as "${me.name}" because that name was already taken.`);
      } else {
        setLobbyNameNotice(null);
      }
      setRoom(initialRoom);
      setScreen(screenForRoom(initialRoom));
    } else {
      setLobbyNameNotice(null);
      setScreen('start');
    }
  };

  const clearLicenseReturnParams = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete('view');
    url.searchParams.delete('purchase');
    url.searchParams.delete('session_id');
    window.history.replaceState(null, '', `${url.pathname}${url.search}`);
    setLicenseReturn({ openLicense: true, purchaseStatus: null, sessionId: null });
  }, []);

  if (!initialized) {
    return (
      <div className={`app${teamsEmbed ? ' app--teams' : ''}`}>
        <header className="app-header">
          <div className="app-header-left">
            <LogoMark size={28} />
            <span className="app-title">InGroups</span>
          </div>
          <div className="app-header-right">
            <button
              type="button"
              className="header-help-btn"
              aria-label="How to Play"
              onClick={() => setShowHowToPlay(true)}
            >
              ?
            </button>
          </div>
        </header>
        <main className="app-content auth-screen">
          <p className="muted">Loading…</p>
        </main>
        {showHowToPlay && (
          <HowToPlayModal onClose={() => setShowHowToPlay(false)} />
        )}
      </div>
    );
  }

  if (!playerId || !room) {
    return (
      <div className={`app${teamsEmbed ? ' app--teams' : ''}`}>
        {closedMessage && (
          <div className="closed-banner">{closedMessage}</div>
        )}
        <header className="app-header">
          <div className="app-header-left">
            <LogoMark size={28} />
            <span className="app-title">InGroups</span>
          </div>
          <div className="app-header-right">
            <button
              type="button"
              className="header-help-btn"
              aria-label="How to Play"
              onClick={() => setShowHowToPlay(true)}
            >
              ?
            </button>
            {!teamsGuestOnly && <HeaderAuth />}
          </div>
        </header>
        {teamsEmbed && (
          <p className="teams-context-banner">
            {teamsProfile.signedInWithTeams
              ? `Signed in with Microsoft Teams${teamsProfile.signedInEmail ? ` (${teamsProfile.signedInEmail})` : ''}`
              : teamsProfile.inTeams
                ? `Microsoft Teams${teamsProfile.meetingId ? ' · In meeting' : ''}${teamsProfile.displayName ? ` · ${teamsProfile.displayName}` : ''}`
                : 'Microsoft Teams preview'}
          </p>
        )}
        <main className="app-content">
          {landingView === 'license' && !teamsGuestOnly && (
            <LicenseScreen
              onBack={() => setLandingView('home')}
              purchaseStatus={licenseReturn.purchaseStatus}
              purchaseSessionId={licenseReturn.sessionId}
              onPurchaseHandled={clearLicenseReturnParams}
            />
          )}
          {landingView === 'createWordSet' && !teamsGuestOnly && (
            <CreateWordSetScreen
              onBack={() => setLandingView('home')}
              onGetLicense={() => setLandingView('license')}
            />
          )}
          {landingView === 'viewWordSets' && (
            <ViewWordSetsScreen onBack={() => setLandingView('home')} />
          )}
          {landingView === 'home' && (
            <LandingScreen
              teamsEmbed={teamsEmbed}
              onEnter={handleEnter}
              onNavigate={(s) => setLandingView(s as LandingView)}
            />
          )}
        </main>

        {showHowToPlay && (
          <HowToPlayModal onClose={() => setShowHowToPlay(false)} />
        )}
      </div>
    );
  }

  const isHost = room.myPlayerId === room.hostId;
  const guest = isGuestMode();

  return (
    <div className={`app${teamsEmbed ? ' app--teams' : ''}`}>
      <header className="app-header">
        <div className="app-header-left">
          <LogoMark size={28} />
          <span className="app-title">InGroups</span>
        </div>
        <div className="app-header-right">
          <button
            type="button"
            className="header-help-btn"
            aria-label="How to Play"
            onClick={() => setShowHowToPlay(true)}
          >
            ?
          </button>
          <button type="button" className="exit-btn" onClick={() => isHost ? setShowExitConfirm(true) : handleExit()}>
            {guest || teamsEmbed ? 'Exit' : isHost ? 'Exit Game' : 'Leave'}
          </button>
          {!guest && !teamsGuestOnly && <HeaderAuth />}
        </div>
      </header>

      <main className="app-content">
        {screen === 'start' && (
          <StartScreen
            room={room}
            nameNotice={lobbyNameNotice}
            onNavigate={(s) => setScreen(s as Screen)}
          />
        )}
        {screen === 'viewWordSets' && (
          <ViewWordSetsScreen onBack={() => setScreen('start')} />
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

      {showHowToPlay && (
        <HowToPlayModal onClose={() => setShowHowToPlay(false)} />
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
