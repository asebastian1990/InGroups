import { useState, useEffect } from 'react';
import type { WordSet } from '@shared/types';
import { getWordSetsForView, getLicense, isGuestMode } from '../api';

interface Props {
  onBack: () => void;
}

function WordSetSections({
  wordSets,
  onSelect,
  showLicenseHint,
}: {
  wordSets: WordSet[];
  onSelect: (set: WordSet) => void;
  showLicenseHint: boolean;
}) {
  const freeSets = wordSets.filter((s) => !s.isPremium && !s.isCustom);
  const premiumSets = wordSets.filter((s) => s.isPremium);
  const customSets = wordSets.filter((s) => s.isCustom);

  return (
    <>
      <ul className="word-set-list">
        {freeSets.map((set) => (
          <li key={set.id} className="word-set-item word-set-item-drilldown" onClick={() => onSelect(set)}>
            <span>{set.name}</span>
            <span className="menu-item-arrow">›</span>
          </li>
        ))}
      </ul>

      {premiumSets.length > 0 && (
        <>
          <p className="group-label" style={{ marginTop: 20 }}>Premium</p>
          <ul className="word-set-list">
            {premiumSets.map((set) => (
              <li key={set.id} className="word-set-item word-set-item-drilldown" onClick={() => onSelect(set)}>
                <span>
                  {set.name} <span className="tag premium">Premium</span>
                </span>
                <span className="menu-item-arrow">›</span>
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
              <li key={set.id} className="word-set-item word-set-item-drilldown" onClick={() => onSelect(set)}>
                <span>{set.name}</span>
                <span className="menu-item-arrow">›</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {freeSets.length === 0 && premiumSets.length === 0 && customSets.length === 0 && (
        <p className="info-msg" style={{ marginTop: 12 }}>No word sets available.</p>
      )}

      {showLicenseHint && (
        <p className="info-msg" style={{ marginTop: 20, fontSize: '0.85rem' }}>
          Add a license to unlock expanded word sets for games you host.
        </p>
      )}
    </>
  );
}

export function ViewWordSetsScreen({ onBack }: Props) {
  const [wordSets, setWordSets] = useState<WordSet[]>([]);
  const [selectedSet, setSelectedSet] = useState<WordSet | null>(null);
  const [showLicenseHint, setShowLicenseHint] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const guest = isGuestMode();
    Promise.all([
      getWordSetsForView(),
      guest ? Promise.resolve(null) : getLicense(),
    ])
      .then(([sets, license]) => {
        setWordSets(sets);
        setShowLicenseHint(guest || !license);
      })
      .finally(() => setLoading(false));
  }, []);

  if (selectedSet) {
    return (
      <div>
        <button type="button" className="back-link" onClick={() => setSelectedSet(null)}>
          ← Back
        </button>
        <h2 style={{ fontSize: '1.2rem', marginBottom: 16 }}>{selectedSet.name}</h2>
        <p className="section-label">{selectedSet.words.length} words</p>
        <textarea
          className="input word-set-view"
          readOnly
          value={selectedSet.words.join('\n')}
          aria-label={`Words in ${selectedSet.name}`}
        />
      </div>
    );
  }

  return (
    <div>
      <button type="button" className="back-link" onClick={onBack}>
        ← Back
      </button>
      <h2 style={{ fontSize: '1.2rem', marginBottom: 16 }}>View Word Sets</h2>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <WordSetSections
          wordSets={wordSets}
          onSelect={setSelectedSet}
          showLicenseHint={showLicenseHint}
        />
      )}
    </div>
  );
}
