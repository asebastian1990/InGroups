import { useState, useEffect } from 'react';
import type { ClientRoomState, WordSet } from '@shared/types';
import { getWordSets, getWordSetsForView, updateSettings } from '../api';

interface Props {
  room: ClientRoomState;
  onBack: () => void;
}

function WordSetListItem({
  set,
  selected,
  isHost,
  selectable,
  onSelect,
  onView,
}: {
  set: WordSet;
  selected: boolean;
  isHost: boolean;
  selectable: boolean;
  onSelect: (set: WordSet) => void;
  onView: (set: WordSet) => void;
}) {
  const locked = !selectable;

  return (
    <li className={`word-set-item ${selected && selectable ? 'selected' : ''}${locked ? ' word-set-item-locked' : ''}`}>
      {isHost && selectable ? (
        <button type="button" className="word-set-item-label word-set-item-label-selectable" onClick={() => onSelect(set)}>
          <span>
            {set.name}
            {set.isPremium && <> <span className="tag premium">Premium</span></>}
          </span>
          {selected && <span className="word-set-item-check"> ✓</span>}
        </button>
      ) : (
        <span className="word-set-item-label">
          <span>
            {set.name}
            {set.isPremium && <> <span className="tag premium">Premium</span></>}
          </span>
          {selected && selectable && <span className="word-set-item-check"> ✓</span>}
        </span>
      )}
      <button type="button" className="word-set-view-btn" onClick={() => onView(set)}>
        View
      </button>
    </li>
  );
}

export function WordSetScreen({ room, onBack }: Props) {
  const [wordSets, setWordSets] = useState<WordSet[]>([]);
  const [selectableIds, setSelectableIds] = useState<Set<string>>(new Set());
  const [viewingSet, setViewingSet] = useState<WordSet | null>(null);
  const isHost = room.myPlayerId === room.hostId;

  useEffect(() => {
    Promise.all([getWordSetsForView(), getWordSets()]).then(([allSets, playableSets]) => {
      setWordSets(allSets);
      setSelectableIds(new Set(playableSets.map((s) => s.id)));
    });
  }, []);

  const isSelectable = (set: WordSet) => selectableIds.has(set.id);

  const handleSelect = (set: WordSet) => {
    if (!isHost || !isSelectable(set)) return;
    updateSettings({ wordSetId: set.id, wordSetName: set.name });
    onBack();
  };

  if (viewingSet) {
    const canUse = isHost && isSelectable(viewingSet);

    return (
      <div>
        <button type="button" className="back-link" onClick={() => setViewingSet(null)}>
          ← Back
        </button>
        <h2 style={{ fontSize: '1.2rem', marginBottom: 16 }}>{viewingSet.name}</h2>
        <p className="section-label">{viewingSet.words.length} words</p>
        <textarea
          className="input word-set-view"
          readOnly
          value={viewingSet.words.join('\n')}
          aria-label={`Words in ${viewingSet.name}`}
        />
        {canUse && (
          <button
            type="button"
            className="btn btn-primary btn-full word-set-use-btn"
            onClick={() => handleSelect(viewingSet)}
          >
            Use This Word Set
          </button>
        )}
      </div>
    );
  }

  const freeSets = wordSets.filter((s) => !s.isPremium && !s.isCustom);
  const premiumSets = wordSets.filter((s) => s.isPremium);
  const customSets = wordSets.filter((s) => s.isCustom);

  return (
    <div>
      <button type="button" className="back-link" onClick={onBack}>← Back</button>
      <h2 style={{ fontSize: '1.2rem', marginBottom: 16 }}>Select Word Set</h2>

      <ul className="word-set-list">
        {freeSets.map((set) => (
          <WordSetListItem
            key={set.id}
            set={set}
            selected={room.wordSetId === set.id}
            isHost={isHost}
            selectable={isSelectable(set)}
            onSelect={handleSelect}
            onView={setViewingSet}
          />
        ))}
      </ul>

      {premiumSets.length > 0 && (
        <>
          <p className="group-label" style={{ marginTop: 20 }}>Premium</p>
          <ul className="word-set-list">
            {premiumSets.map((set) => (
              <WordSetListItem
                key={set.id}
                set={set}
                selected={room.wordSetId === set.id}
                isHost={isHost}
                selectable={isSelectable(set)}
                onSelect={handleSelect}
                onView={setViewingSet}
              />
            ))}
          </ul>
        </>
      )}

      {customSets.length > 0 && (
        <>
          <p className="group-label" style={{ marginTop: 20 }}>Custom</p>
          <ul className="word-set-list">
            {customSets.map((set) => (
              <WordSetListItem
                key={set.id}
                set={set}
                selected={room.wordSetId === set.id}
                isHost={isHost}
                selectable={isSelectable(set)}
                onSelect={handleSelect}
                onView={setViewingSet}
              />
            ))}
          </ul>
        </>
      )}

      {isHost && premiumSets.some((s) => !isSelectable(s)) && (
        <p className="info-msg" style={{ marginTop: 20, fontSize: '0.85rem' }}>
          Add a license to unlock expanded word sets for games you host.
        </p>
      )}
    </div>
  );
}
