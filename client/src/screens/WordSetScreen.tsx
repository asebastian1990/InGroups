import { useState, useEffect } from 'react';
import type { ClientRoomState, WordSet } from '@shared/types';
import { getWordSets, updateSettings } from '../api';

interface Props {
  room: ClientRoomState;
  onBack: () => void;
}

export function WordSetScreen({ room, onBack }: Props) {
  const [wordSets, setWordSets] = useState<WordSet[]>([]);
  const isHost = room.myPlayerId === room.hostId;

  useEffect(() => {
    getWordSets().then(setWordSets);
  }, []);

  const handleSelect = (set: WordSet) => {
    if (!isHost) return;
    if (set.isPremium && !wordSets.some((s) => s.id === set.id && !s.isPremium)) {
      // premium check handled server-side
    }
    updateSettings({ wordSetId: set.id, wordSetName: set.name });
    onBack();
  };

  const freeSets = wordSets.filter((s) => !s.isPremium && !s.isCustom);
  const premiumSets = wordSets.filter((s) => s.isPremium);
  const customSets = wordSets.filter((s) => s.isCustom);

  return (
    <div>
      <button className="back-link" onClick={onBack}>← Back</button>
      <h2 style={{ fontSize: '1.2rem', marginBottom: 16 }}>Select Word Set</h2>

      <ul className="word-set-list">
        {freeSets.map((set) => (
          <li
            key={set.id}
            className={`word-set-item ${room.wordSetId === set.id ? 'selected' : ''}`}
            onClick={() => handleSelect(set)}
          >
            {set.name}
            {room.wordSetId === set.id && ' ✓'}
          </li>
        ))}
      </ul>

      {premiumSets.length > 0 && (
        <>
          <p className="group-label" style={{ marginTop: 20 }}>Premium</p>
          <ul className="word-set-list">
            {premiumSets.map((set) => (
              <li
                key={set.id}
                className={`word-set-item ${room.wordSetId === set.id ? 'selected' : ''}`}
                onClick={() => handleSelect(set)}
              >
                <span>{set.name} <span className="tag premium">Premium</span></span>
                {room.wordSetId === set.id && ' ✓'}
              </li>
            ))}
          </ul>
        </>
      )}

      {customSets.length > 0 && (
        <>
          <p className="group-label" style={{ marginTop: 20 }}>Custom</p>
          <ul className="word-set-list">
            {customSets.map((set) => (
              <li
                key={set.id}
                className={`word-set-item ${room.wordSetId === set.id ? 'selected' : ''}`}
                onClick={() => handleSelect(set)}
              >
                {set.name}
                {room.wordSetId === set.id && ' ✓'}
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="info-msg" style={{ marginTop: 20, fontSize: '0.85rem' }}>
        Subscribe for more word sets and to create your own!
      </p>
    </div>
  );
}
