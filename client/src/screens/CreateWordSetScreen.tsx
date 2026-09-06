import { useState, useEffect } from 'react';
import type { WordSet } from '@shared/types';
import { getWordSets, saveWordSet, deleteWordSet, getLicense } from '../api';

interface Props {
  onBack: () => void;
  editSet?: WordSet;
}

export function CreateWordSetScreen({ onBack, editSet }: Props) {
  const [hasLicense, setHasLicense] = useState(false);
  const [name, setName] = useState(editSet?.name ?? '');
  const [wordsText, setWordsText] = useState(editSet?.words.join('\n') ?? '');
  const [customSets, setCustomSets] = useState<WordSet[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState<WordSet | null>(editSet ?? null);

  useEffect(() => {
    Promise.all([getLicense(), getWordSets()])
      .then(([license, sets]) => {
        setHasLicense(!!license);
        setCustomSets(sets.filter((s) => s.isCustom));
      })
      .catch(() => {});
  }, []);

  const parseWords = (text: string): string[] => {
    return text
      .split(/[\n,]+/)
      .map((w) => w.trim())
      .filter(Boolean);
  };

  const handleSave = async () => {
    const words = parseWords(wordsText);
    if (words.length < 20) {
      setError(`Minimum 20 words required (${words.length} entered)`);
      return;
    }
    const result = await saveWordSet(editing?.id ?? '', name || 'New Set', words);
    if (result.success) {
      setSuccess('Word set saved!');
      setError('');
      getWordSets().then((sets) => setCustomSets(sets.filter((s) => s.isCustom)));
    } else {
      setError(result.error ?? 'Failed to save');
    }
  };

  const handleDelete = async () => {
    if (!editing) return;
    const result = await deleteWordSet(editing.id);
    if (result.success) {
      setEditing(null);
      setName('');
      setWordsText('');
      getWordSets().then((sets) => setCustomSets(sets.filter((s) => s.isCustom)));
    }
  };

  const handleEditExisting = (set: WordSet) => {
    setEditing(set);
    setName(set.name);
    setWordsText(set.words.join('\n'));
  };

  const handleCreateNew = () => {
    setEditing(null);
    setName('');
    setWordsText('');
  };

  if (!hasLicense) {
    return (
      <div>
        <button className="back-link" onClick={onBack}>← Back</button>
        <h2 style={{ fontSize: '1.2rem', marginBottom: 16 }}>Create Word Set</h2>
        <p className="info-msg">Subscribe to create your own word sets!</p>
      </div>
    );
  }

  return (
    <div>
      <button className="back-link" onClick={onBack}>← Back</button>
      <h2 style={{ fontSize: '1.2rem', marginBottom: 16 }}>Create Word Set</h2>

      {customSets.length > 0 && !editing && (
        <>
          <p className="section-label">Your Sets</p>
          <ul className="word-set-list">
            {customSets.map((set) => (
              <li key={set.id} className="word-set-item" onClick={() => handleEditExisting(set)}>
                {set.name} ›
              </li>
            ))}
          </ul>
          <button className="btn" style={{ marginTop: 12 }} onClick={handleCreateNew}>
            Create New…
          </button>
        </>
      )}

      {(editing || customSets.length === 0) && (
        <>
          <label className="input-label">Set Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="New Set 1" />

          <label className="input-label" style={{ marginTop: 12 }}>
            Paste in a set of words, or type words one by one (min 20):
          </label>
          <textarea
            className="input"
            value={wordsText}
            onChange={(e) => setWordsText(e.target.value)}
            placeholder={'apple\nbanana\ncookie\ndough\negg\nflour\n...'}
          />

          <div className="btn-row" style={{ marginTop: 12 }}>
            <button className="btn btn-primary" onClick={handleSave}>Save</button>
            {editing && (
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            )}
          </div>
        </>
      )}

      {error && <p className="error-msg">{error}</p>}
      {success && <p style={{ color: 'var(--brand-teal)', fontSize: '0.85rem', marginTop: 8 }}>{success}</p>}
    </div>
  );
}
