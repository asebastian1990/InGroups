import { useState } from 'react';
import type { ClientRoomState } from '@shared/types';
import { MIN_PLAYERS } from '@shared/types';
import { startGame } from '../api';
import { HowToPlayModal } from '../components/UI';
import { PlayerList } from '../components/PlayerList';

interface Props {
  room: ClientRoomState;
}

export function StartScreen({ room }: Props) {
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const isHost = room.myPlayerId === room.hostId;

  return (
    <div>
      <div className="room-code-banner">
        <span className="room-code-label">Room code</span>
        <span className="room-code-value">{room.code}</span>
      </div>

      <div className="menu-item" onClick={() => setShowHowToPlay(true)}>
        <span>How to Play</span>
        <span className="menu-item-arrow">›</span>
      </div>

      <PlayerList players={room.players} />

      {isHost ? (
        <div style={{ marginTop: 24 }}>
          <button
            className="btn btn-primary"
            onClick={() => startGame()}
            disabled={room.players.length < MIN_PLAYERS}
          >
            Start Game
          </button>
          {room.players.length < MIN_PLAYERS && (
            <p className="info-msg" style={{ marginTop: 8, fontSize: '0.85rem' }}>
              Need at least {MIN_PLAYERS} players ({room.players.length} joined)
            </p>
          )}
        </div>
      ) : (
        <p className="waiting-msg">Waiting for host to start the game…</p>
      )}

      {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}
    </div>
  );
}
