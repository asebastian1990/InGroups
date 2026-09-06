import { useState } from 'react';
import { Logo } from '../components/Logo';
import { createRoom, joinRoom, isGuestMode } from '../api';
import type { ClientRoomState } from '@shared/types';

interface Props {
  onEnter: (playerId: string, roomCode: string, room?: ClientRoomState) => void;
  onNavigate: (screen: string) => void;
}

export function LandingScreen({ onEnter, onNavigate }: Props) {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const guest = isGuestMode();

  const handleCreate = async () => {
    if (!name.trim() || creating || joining) return;
    setCreating(true);
    setError('');
    try {
      const { playerId, room } = await createRoom(name.trim());
      onEnter(playerId, room.code, room);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!name.trim() || !roomCode.trim() || creating || joining) return;
    setJoining(true);
    setError('');
    try {
      const { playerId, room } = await joinRoom(roomCode.trim(), name.trim());
      onEnter(playerId, room.code, room);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to join room');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="landing">
      <div className="landing-logo">
        <Logo size={64} />
      </div>
      <h1>InGroups</h1>
      <p>Align with your group on a secret word—without giving it away!</p>

      <div className="landing-form">
        <label className="input-label">Your Name</label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          autoFocus
        />

        <div className="landing-section-divider" aria-hidden="true" />

        <button className="btn btn-primary" onClick={handleCreate} disabled={creating || joining || !name.trim()}>
          {creating ? 'Creating…' : 'Host New Game'}
        </button>
        <div className="landing-divider">or join with room code</div>
        <input
          className="input"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          placeholder="ABCD"
          maxLength={4}
        />
        <button className="btn" onClick={handleJoin} disabled={creating || joining || !name.trim() || !roomCode.trim()}>
          {joining ? 'Joining…' : 'Join Game'}
        </button>
        {error && <p className="error-msg">{error}</p>}
      </div>

      {!guest && (
        <div className="landing-menu">
          <div className="menu-item" onClick={() => onNavigate('createWordSet')}>
            <span>Create Word Set</span>
            <span className="menu-item-arrow">›</span>
          </div>
          <div className="menu-item" onClick={() => onNavigate('license')}>
            <span>License Key</span>
            <span className="menu-item-arrow">›</span>
          </div>
        </div>
      )}
    </div>
  );
}
