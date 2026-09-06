import { useState, useEffect } from 'react';
import { activateLicense, getLicense } from '../api';

interface Props {
  onBack: () => void;
}

export function LicenseScreen({ onBack }: Props) {
  const [key, setKey] = useState('');
  const [currentLicense, setCurrentLicense] = useState<{ key: string } | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getLicense().then(setCurrentLicense).catch((err) => {
      setError(err instanceof Error ? err.message : 'Failed to load license');
    });
  }, []);

  const handleActivate = async () => {
    const trimmed = key.trim();
    if (!trimmed || loading) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const result = await activateLicense(trimmed);
      if (result.valid) {
        setSuccess('License activated!');
        setCurrentLicense({ key: trimmed });
        setKey('');
      } else {
        setError(result.error ?? 'Invalid license key');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate license');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button className="back-link" onClick={onBack}>← Back</button>
      <h2 style={{ fontSize: '1.2rem', marginBottom: 16 }}>License Key</h2>

      {currentLicense ? (
        <div style={{ marginBottom: 20 }}>
          <p className="section-label">Current License</p>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}>{currentLicense.key}</p>
        </div>
      ) : (
        <p className="info-msg" style={{ marginBottom: 20 }}>
          No license — unlock expanded word sets, play with others who have expanded word sets, and create your own word sets!
        </p>
      )}

      {!currentLicense && (
        <>
          <label className="input-label">Enter License Key</label>
          <input
            className="input"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
          />
          <button
            className="btn btn-primary"
            style={{ marginTop: 12 }}
            onClick={handleActivate}
            disabled={loading || !key.trim()}
          >
            {loading ? 'Activating…' : 'Activate'}
          </button>
        </>
      )}

      {error && <p className="error-msg" style={{ marginTop: 8 }}>{error}</p>}
      {success && <p style={{ color: 'var(--brand-teal)', fontSize: '0.85rem', marginTop: 8 }}>{success}</p>}
    </div>
  );
}
