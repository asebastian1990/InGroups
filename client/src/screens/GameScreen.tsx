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
  removePlayer,
  movePlayer,
  getWordSets,
  updateSettings,
} from '../api';
import { Collapsible, ConfirmModal, Modal } from '../components/UI';
import { ThoughtfulPrompts } from '../components/ThoughtfulPrompts';

interface Props {
  room: ClientRoomState;
  onNavigate: (screen: string) => void;
}

function PlayerRow({
  player,
  showGuess,
  myPlayerId,
  onSelect,
}: {
  player: ClientPlayer;
  showGuess: boolean;
  myPlayerId: string;
  onSelect?: (player: ClientPlayer) => void;
}) {
  const isMe = player.id === myPlayerId;
  const selectable = !!onSelect;

  return (
    <li
      className={`player-item${selectable ? ' player-item-selectable' : ''}`}
      onClick={selectable ? () => onSelect(player) : undefined}
      onKeyDown={
        selectable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(player);
              }
            }
          : undefined
      }
      role={selectable ? 'button' : undefined}
      tabIndex={selectable ? 0 : undefined}
    >
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
  const [selectedPlayer, setSelectedPlayer] = useState<ClientPlayer | null>(null);
  const [removeConfirmPlayer, setRemoveConfirmPlayer] = useState<ClientPlayer | null>(null);
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
  const canManagePlayers = isHost && !isPlaying;
  const handleSelectPlayer = canManagePlayers ? setSelectedPlayer : undefined;
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

  const handleMovePlayer = (playerId: string, destination: 'inGroup' | number) => {
    setSelectedPlayer(null);
    setHostError('');
    void movePlayer(playerId, destination)
      .then((result) => {
        if (!result.success) {
          setHostError(result.error ?? 'Failed to move player');
        }
      })
      .catch((err) => {
        setHostError(err instanceof Error ? err.message : 'Failed to move player');
      });
  };

  const handleConfirmRemovePlayer = () => {
    if (!removeConfirmPlayer) return;
    const player = removeConfirmPlayer;
    setRemoveConfirmPlayer(null);
    setHostError('');
    void removePlayer(player.id)
      .then((result) => {
        if (!result.success) {
          setHostError(result.error ?? 'Failed to remove player');
        }
      })
      .catch((err) => {
        setHostError(err instanceof Error ? err.message : 'Failed to remove player');
      });
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

  const activeRoundMessage =
    room.myRole === 'inGroup'
      ? 'Round started. You are (IN GROUP). Try to align on one of the words below without tipping off the OUT GROUPS! Tap a word to lock in your guess.'
      : 'Round started. You are (OUT GROUP). Observe the IN GROUP to see if you can guess their word! Tap a word to lock in your guess.';

  const idleRoundMessage = isRoundEnd
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

  const inGroupSection = (
    <Collapsible title="In Group" open={inGroupOpen} onOpenChange={setInGroupOpen}>
      {inGroup && getGroupPlayers(inGroup.id).map((p) => (
        <PlayerRow
          key={p.id}
          player={p}
          showGuess={showResults}
          myPlayerId={room.myPlayerId}
          onSelect={handleSelectPlayer}
        />
      ))}
    </Collapsible>
  );

  const outGroupsSection = (
    <Collapsible title="Out Groups" open={outGroupsOpen} onOpenChange={setOutGroupsOpen}>
      {outGroups.map((group) => (
        <div key={group.id}>
          <p className="group-label">Group {group.id + 1}</p>
          {getGroupPlayers(group.id).map((p) => (
            <PlayerRow
              key={p.id}
              player={p}
              showGuess={showResults}
              myPlayerId={room.myPlayerId}
              onSelect={handleSelectPlayer}
            />
          ))}
        </div>
      ))}
    </Collapsible>
  );

  const scoreboardSection = (
    <Collapsible title="Scoreboard" defaultOpen={false}>
      <ul className="player-list">
        {[...room.players]
          .sort((a, b) => b.score - a.score)
          .map((p) => (
            <PlayerRow
              key={p.id}
              player={p}
              showGuess={false}
              myPlayerId={room.myPlayerId}
              onSelect={handleSelectPlayer}
            />
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
  );

  const roomCodeButton = (
    <button
      type="button"
      className="btn btn-full"
      style={{ marginTop: 12 }}
      onClick={() => setShowRoomCode(true)}
    >
      Room Code
    </button>
  );

  return (
    <div>
      {gameStarted && (
        <>
          {inGroupSection}

          {isPlaying && room.roundWords.length > 0 && (
            <>
              <div className={`round-banner ${room.myRole === 'inGroup' ? 'in-group' : 'out-group'}`}>
                {activeRoundMessage}
              </div>

              {room.myRole === 'inGroup' && <ThoughtfulPrompts />}

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

              {outGroupsSection}
              {scoreboardSection}

              {isHost && (
                <button
                  className="btn btn-danger"
                  style={{ marginTop: 12 }}
                  onClick={() => setConfirmAction('endRound')}
                >
                  End Round
                </button>
              )}

              {roomCodeButton}
            </>
          )}

          {!isPlaying && (
            <>
              {outGroupsSection}
              {scoreboardSection}

              {!isHost && (
                <p className="section-label" style={{ marginTop: 16 }}>
                  Word Set: {room.wordSetName}
                </p>
              )}

              {idleRoundMessage && (
                <div className={`round-banner ${room.myRole === 'inGroup' ? 'in-group' : 'out-group'}`}>
                  {idleRoundMessage}
                </div>
              )}

              {isHost && (
                <div className="menu-item menu-item-outlined" onClick={() => onNavigate('wordSet')}>
                  <span>Select Word Set</span>
                  <span className="menu-item-arrow">
                    <span className="menu-item-value">{selectedSet?.name ?? room.wordSetName}</span>
                    {' ›'}
                  </span>
                </div>
              )}

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
                      room.needsReshuffle ? (
                        <p className="info-msg" style={{ fontSize: '0.85rem' }}>
                          Adjust or shuffle groups before starting the next round.
                        </p>
                      ) : (
                        <p className="error-msg">
                          In Group needs at least {MIN_IN_GROUP_SIZE} players and every Out Group needs at least 1 player.
                        </p>
                      )
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

              {roomCodeButton}
            </>
          )}
        </>
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

      {selectedPlayer && (
        <Modal title={selectedPlayer.name} onClose={() => setSelectedPlayer(null)}>
          <div className="player-action-menu">
            {selectedPlayer.isInGroup &&
              outGroups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  className="btn btn-full"
                  onClick={() => handleMovePlayer(selectedPlayer.id, group.id)}
                >
                  Move to Out Group — Group {group.id + 1}
                </button>
              ))}
            {!selectedPlayer.isInGroup && (
              <button
                type="button"
                className="btn btn-full"
                onClick={() => handleMovePlayer(selectedPlayer.id, 'inGroup')}
              >
                Move to In Group
              </button>
            )}
            {!selectedPlayer.isHost && (
              <button
                type="button"
                className="btn btn-danger btn-full"
                onClick={() => {
                  setRemoveConfirmPlayer(selectedPlayer);
                  setSelectedPlayer(null);
                }}
              >
                Remove Player
              </button>
            )}
          </div>
          <div className="modal-actions">
            <button type="button" className="btn" onClick={() => setSelectedPlayer(null)}>
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {removeConfirmPlayer && (
        <ConfirmModal
          message={`Are you sure you want to remove ${removeConfirmPlayer.name} from the game?`}
          onConfirm={handleConfirmRemovePlayer}
          onCancel={() => setRemoveConfirmPlayer(null)}
        />
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
