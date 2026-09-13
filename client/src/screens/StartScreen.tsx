import { useState } from 'react';
import type { ClientRoomState } from '@shared/types';
import {
  MIN_PLAYERS,
  MIN_WIN_CONDITION_POINTS,
  MAX_WIN_CONDITION_POINTS,
} from '@shared/types';
import { startGame, updateSettings } from '../api';
import { HowToPlayModal } from '../components/UI';
import { PlayerList } from '../components/PlayerList';

interface Props {
  room: ClientRoomState;
  nameNotice?: string | null;
}

export function StartScreen({ room, nameNotice }: Props) {
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const isHost = room.myPlayerId === room.hostId;

  const adjustWinCondition = (delta: number) => {
    const current = room.winConditionPoints ?? 10;
    let next = current + delta;
    if (next < MIN_WIN_CONDITION_POINTS) next = MAX_WIN_CONDITION_POINTS;
    if (next > MAX_WIN_CONDITION_POINTS) next = MIN_WIN_CONDITION_POINTS;
    updateSettings({ winConditionPoints: next });
  };

  const winConditionLabel =
    (room.winConditionPoints ?? 0) === 0 ? 'Off' : String(room.winConditionPoints);

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

      {isHost ? (
        <div className="host-controls-row host-controls-row-timer win-condition-row">
          <div className="number-input number-input-compact">
            <button type="button" onClick={() => adjustWinCondition(-1)}>
              −
            </button>
            <span className="number-input-value number-input-value-timer">{winConditionLabel}</span>
            <button type="button" onClick={() => adjustWinCondition(1)}>
              +
            </button>
            <span className="number-input-label">Win Condition (points)</span>
          </div>
        </div>
      ) : (
        <p className="section-label win-condition-readonly">
          Win Condition: {(room.winConditionPoints ?? 0) === 0 ? 'Off' : `${room.winConditionPoints} points`}
        </p>
      )}

      <PlayerList players={room.players} />

      {nameNotice && (
        <p className="info-msg" style={{ marginTop: 12 }}>
          {nameNotice}
        </p>
      )}

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
            <p className="error-msg">
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
