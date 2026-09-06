import { useState, useEffect } from 'react';
import type { ClientRoomState, ClientPlayer, WordSet } from '@shared/types';
import { MIN_IN_GROUP_SIZE } from '@shared/types';
import {
  startRound,
  endRound,
  submitGuess,
  shuffleGroups,
  shiftGroups,
  resetScores,
  getWordSets,
  updateSettings,
} from '../api';
import { Collapsible, ConfirmModal, Modal } from '../components/UI';

interface Props {
  room: ClientRoomState;
  onNavigate: (screen: string) => void;
}

function formatTime(seconds: number | null): string {
  if (seconds === null) return '5:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function PlayerRow({
  player,
  showGuess,
  myPlayerId,
}: {
  player: ClientPlayer;
  showGuess: boolean;
  myPlayerId: string;
}) {
  const isMe = player.id === myPlayerId;
  return (
    <li className="player-item">
      <span className="player-icon">
        {player.name.charAt(0).toUpperCase()}
      </span>
      <span className={`player-name ${isMe ? 'player-name-me' : ''}`}>
        {player.name}
        {player.isHost && <span className="host-badge">Host</span>}
      </span>
      {showGuess && player.guess && (
        <span className="player-guess">{player.guess}</span>
      )}
      {showGuess && (
        <span className={`player-points ${player.roundPoints > 0 ? 'positive' : ''}`}>
          {player.roundPoints > 0 ? `+${player.roundPoints}` : '+0'}
        </span>
      )}
      {!showGuess && (
        <span className="player-score">{player.score}</span>
      )}
    </li>
  );
}

export function GameScreen({ room, onNavigate }: Props) {
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [wordSets, setWordSets] = useState<WordSet[]>([]);
  const [hostError, setHostError] = useState('');
  const [showRoomCode, setShowRoomCode] = useState(false);
  const [inGroupOpen, setInGroupOpen] = useState(true);
  const [outGroupsOpen, setOutGroupsOpen] = useState(true);
  const isHost = room.myPlayerId === room.hostId;

  const maxGroups = Math.max(2, room.players.length - 1);

  useEffect(() => {
    if (isHost) getWordSets().then(setWordSets);
  }, [isHost, room.wordSetId]);

  useEffect(() => {
    if (isHost && room.numGroups > maxGroups) {
      updateSettings({ numGroups: maxGroups });
    }
  }, [isHost, room.numGroups, maxGroups]);
  const isPlaying = room.phase === 'playing';
  const isRoundEnd = room.phase === 'roundEnd';
  const showResults = isRoundEnd;
  const myGuess = room.players.find((p) => p.id === room.myPlayerId)?.guess ?? null;

  const inGroup = room.groups.find((g) => g.isInGroup);
  const outGroups = room.groups.filter((g) => !g.isInGroup);

  const getGroupPlayers = (groupId: number): ClientPlayer[] => {
    const group = room.groups.find((g) => g.id === groupId);
    if (!group) return [];
    return group.playerIds
      .map((id) => room.players.find((p) => p.id === id))
      .filter(Boolean) as ClientPlayer[];
  };

  const handleWordClick = (word: string) => {
    submitGuess(myGuess === word ? null : word);
  };

  const handleConfirm = () => {
    switch (confirmAction) {
      case 'endRound': endRound(); break;
      case 'resetScores': resetScores(); break;
    }
    setConfirmAction(null);
  };

  const handleNumGroupsChange = (n: number) => {
    const val = Math.max(2, Math.min(maxGroups, n));
    setHostError('');
    updateSettings({ numGroups: val });
  };

  const handleShuffleGroups = async () => {
    setInGroupOpen(true);
    setOutGroupsOpen(true);
    setHostError('');
    try {
      const result = await shuffleGroups();
      if (!result.success) {
        setHostError(result.error ?? 'Failed to shuffle groups');
      }
    } catch (err) {
      setHostError(err instanceof Error ? err.message : 'Failed to shuffle groups');
    }
  };

  const handleShiftGroups = () => {
    setInGroupOpen(true);
    setOutGroupsOpen(true);
    shiftGroups();
  };

  const roleMessage = isPlaying
    ? room.myRole === 'inGroup'
      ? 'Round started. You are (IN GROUP). Talk with your group, try to align on a word below without tipping off the OUT GROUPS!'
      : 'Round started. You are (OUT GROUP). No talking, listen to the IN GROUP to see if you can guess their word!'
    : isRoundEnd
      ? room.roundNotice ?? 'Round over! All participants can discuss hints, guesses, stories, etc.'
      : null;

  const gameStarted = room.groups.length > 0;
  const selectedSet = wordSets.find((s) => s.id === room.wordSetId);
  const inGroupForStart = room.groups.find((g) => g.isInGroup);
  const canStartRound =
    !room.needsReshuffle &&
    !!inGroupForStart &&
    inGroupForStart.playerIds.length >= MIN_IN_GROUP_SIZE &&
    !room.groups.some((g) => g.playerIds.length === 0);


  return (
    <div>
      <Collapsible title="Scoreboard" defaultOpen={false}>
        <ul className="player-list">
          {[...room.players]
            .sort((a, b) => b.score - a.score)
            .map((p) => (
              <PlayerRow key={p.id} player={p} showGuess={false} myPlayerId={room.myPlayerId} />
            ))}
        </ul>
        {isHost && (
          <button
            className="btn btn-danger"
            style={{ marginTop: 12, fontSize: '0.85rem' }}
            onClick={() => setConfirmAction('resetScores')}
          >
            Reset Scores
          </button>
        )}
      </Collapsible>

      {gameStarted && (
        <>
          <Collapsible title="In Group" open={inGroupOpen} onOpenChange={setInGroupOpen}>
            {inGroup && getGroupPlayers(inGroup.id).map((p) => (
              <PlayerRow key={p.id} player={p} showGuess={showResults} myPlayerId={room.myPlayerId} />
            ))}
          </Collapsible>

          <Collapsible title="Out Groups" open={outGroupsOpen} onOpenChange={setOutGroupsOpen}>
            {outGroups.map((group) => (
              <div key={group.id}>
                <p className="group-label">Group {group.id + 1}</p>
                {getGroupPlayers(group.id).map((p) => (
                  <PlayerRow key={p.id} player={p} showGuess={showResults} myPlayerId={room.myPlayerId} />
                ))}
              </div>
            ))}
          </Collapsible>
        </>
      )}

      {isHost && !isPlaying && gameStarted && (
        <div className="menu-item" onClick={() => onNavigate('wordSet')}>
          <span>Select Word Set</span>
          <span className="menu-item-arrow">{selectedSet?.name ?? room.wordSetName} ›</span>
        </div>
      )}

      {!isHost && (
        <p className="section-label" style={{ marginTop: 16 }}>
          Word Set: {room.wordSetName}
        </p>
      )}

      {roleMessage && (
        <div className={`round-banner ${room.myRole === 'inGroup' ? 'in-group' : 'out-group'}`}>
          {roleMessage}
        </div>
      )}

      {isPlaying && room.roundWords.length > 0 && (
        <>
          <div className="word-grid">
            {room.roundWords.map((word) => (
              <button
                key={word}
                type="button"
                className={`word-cell ${myGuess === word ? 'selected' : ''}`}
                onClick={() => handleWordClick(word)}
              >
                {word}
              </button>
            ))}
          </div>

          <div className="timer">{formatTime(room.roundTimer)}</div>
          <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--gray-400)', fontFamily: 'var(--font-sans)' }}>
            Tap a word to lock in your guess. Tap again to deselect. Round ends when all players have guessed or after 5 minutes.
          </p>

          {isHost && (
            <button
              className="btn btn-danger"
              style={{ marginTop: 12 }}
              onClick={() => setConfirmAction('endRound')}
            >
              End Round
            </button>
          )}
        </>
      )}

      {!isPlaying && gameStarted && (
        <div style={{ marginTop: 20 }}>
          {isHost ? (
            <div className="host-controls">
              <button
                type="button"
                className="btn btn-primary btn-full"
                onClick={startRound}
                disabled={!canStartRound}
              >
                Start Round
              </button>
              <button type="button" className="btn btn-full" onClick={handleShiftGroups}>
                Shift Groups
              </button>
              <div className="host-controls-row">
                <button type="button" className="btn btn-shuffle" onClick={handleShuffleGroups}>
                  Shuffle Groups
                </button>
                <div className="number-input number-input-compact">
                  <button type="button" onClick={() => handleNumGroupsChange(room.numGroups - 1)} disabled={room.numGroups <= 2}>−</button>
                  <span className="number-input-value">{room.numGroups}</span>
                  <button type="button" onClick={() => handleNumGroupsChange(room.numGroups + 1)} disabled={room.numGroups >= maxGroups}>+</button>
                  <span className="number-input-label">Groups</span>
                </div>
              </div>
              {hostError && <p className="error-msg">{hostError}</p>}
              {!canStartRound && (
                <p className="info-msg" style={{ fontSize: '0.85rem' }}>
                  Shuffle groups before starting the next round — In Group needs at least {MIN_IN_GROUP_SIZE} players.
                </p>
              )}
            </div>
          ) : (
            <p className="waiting-msg">
              {room.needsReshuffle
                ? 'Waiting for host to shuffle groups…'
                : isRoundEnd
                  ? 'Waiting for host to start next round…'
                  : 'Waiting for host to start.'}
            </p>
          )}
        </div>
      )}

      {gameStarted && (
        <button
          type="button"
          className="btn btn-full"
          style={{ marginTop: 12 }}
          onClick={() => setShowRoomCode(true)}
        >
          Room Code
        </button>
      )}

      {showRoomCode && (
        <Modal title="Room Code" onClose={() => setShowRoomCode(false)}>
          <p className="room-code-display">{room.code}</p>
          <p className="info-msg" style={{ fontSize: '0.85rem', marginTop: 12 }}>
            Share this code so players can rejoin the game.
          </p>
          <div className="modal-actions">
            <button type="button" className="btn btn-primary" onClick={() => setShowRoomCode(false)}>
              Done
            </button>
          </div>
        </Modal>
      )}

      {confirmAction === 'endRound' && (
        <ConfirmModal
          message="End the current round early? All players who haven't guessed will keep a blank guess."
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {confirmAction === 'resetScores' && (
        <ConfirmModal
          message="Reset all player scores to zero? This cannot be undone."
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
