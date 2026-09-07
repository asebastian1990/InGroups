import { useState, useEffect, useCallback } from 'react';
import {
  activateLicense,
  confirmLicensePurchase,
  getLicensePurchaseSummary,
} from '../api';
import type { LicensePurchaseSummary } from '@shared/types';
import { LicenseShopModal } from '../components/LicenseShopModal';

interface Props {
  onBack: () => void;
  purchaseStatus?: 'success' | 'cancelled' | null;
  purchaseSessionId?: string | null;
  onPurchaseHandled?: () => void;
}

export function LicenseScreen({
  onBack,
  purchaseStatus,
  purchaseSessionId,
  onPurchaseHandled,
}: Props) {
  const [key, setKey] = useState('');
  const [summary, setSummary] = useState<LicensePurchaseSummary | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    const data = await getLicensePurchaseSummary();
    setSummary(data);
    return data;
  }, []);

  useEffect(() => {
    loadSummary().catch((err) => {
      setError(err instanceof Error ? err.message : 'Failed to load license');
    });
  }, [loadSummary]);

  useEffect(() => {
    if (purchaseStatus !== 'success' || !purchaseSessionId) return;

    setLoading(true);
    confirmLicensePurchase(purchaseSessionId)
      .then((data) => {
        setSummary(data);
        setSuccess('Purchase complete! Your license key(s) are below.');
        onPurchaseHandled?.();
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to confirm purchase');
      })
      .finally(() => setLoading(false));
  }, [purchaseStatus, purchaseSessionId, onPurchaseHandled]);

  useEffect(() => {
    if (purchaseStatus === 'cancelled') {
      setError('Checkout was cancelled.');
      onPurchaseHandled?.();
    }
  }, [purchaseStatus, onPurchaseHandled]);

  const activeLicense = summary?.activeLicense ?? null;
  const unusedPurchasedKeys =
    summary?.purchasedKeys.filter((entry) => !entry.activated).map((entry) => entry.key) ?? [];

  const copyLicenseKey = async (licenseKey: string) => {
    try {
      await navigator.clipboard.writeText(licenseKey);
      setCopiedKey(licenseKey);
      window.setTimeout(() => {
        setCopiedKey((current) => (current === licenseKey ? null : current));
      }, 2000);
    } catch {
      setError('Could not copy to clipboard.');
    }
  };

  const downloadUnusedKeysCsv = () => {
    if (unusedPurchasedKeys.length === 0) return;
    const lines = ['license_key', ...unusedPurchasedKeys.map((k) => `"${k.replace(/"/g, '""')}"`)];
    const blob = new Blob([`${lines.join('\n')}\n`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ingroups-unused-license-keys.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

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
        setKey('');
        await loadSummary();
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
      <h2 style={{ fontSize: '1.2rem', marginBottom: 16 }}>License</h2>

      {activeLicense ? (
        <div style={{ marginBottom: 20 }}>
          <p className="section-label">Active License (this account)</p>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}>{activeLicense.key}</p>
          <p className="info-msg" style={{ fontSize: '0.8rem', marginTop: 8 }}>
            Only the host needs a license to use expanded word sets in a game.
          </p>
        </div>
      ) : (
        <p className="info-msg" style={{ marginBottom: 20 }}>
          Add a license to unlock expanded word sets and create your own word sets!
        </p>
      )}

      <button
        type="button"
        className="btn btn-primary btn-full"
        style={{ marginBottom: 20 }}
        onClick={() => setShowShop(true)}
      >
        Get License
      </button>

      {unusedPurchasedKeys.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div className="license-key-header">
            <p className="section-label">Your unused license keys</p>
            <button
              type="button"
              className="btn"
              style={{ fontSize: '0.75rem', padding: '6px 10px' }}
              onClick={downloadUnusedKeysCsv}
            >
              Download CSV
            </button>
          </div>
          <ul className="license-key-list">
            {unusedPurchasedKeys.map((licenseKey) => (
              <li key={licenseKey} className="license-key-item">
                <code>{licenseKey}</code>
                <button
                  type="button"
                  className="license-key-copy"
                  onClick={() => copyLicenseKey(licenseKey)}
                  aria-label={`Copy ${licenseKey}`}
                >
                  {copiedKey === licenseKey ? 'Copied!' : 'Copy'}
                </button>
              </li>
            ))}
          </ul>
          <p className="info-msg" style={{ fontSize: '0.8rem', marginTop: 8 }}>
            Share these with friends or activate one on another account. Each key works for one account.
          </p>
        </div>
      )}

      {!activeLicense && (
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

      {showShop && <LicenseShopModal onClose={() => setShowShop(false)} />}
    </div>
  );
}
