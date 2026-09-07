import { useEffect, useState } from 'react';
import { LICENSE_MIN_QUANTITY, LICENSE_UNIT_PRICE_CENTS } from '@shared/types';
import { createLicenseCheckout, getLicenseShopConfig, type LicenseShopConfig } from '../api';
import { Modal } from './UI';

interface Props {
  onClose: () => void;
}

function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function LicenseShopModal({ onClose }: Props) {
  const [config, setConfig] = useState<LicenseShopConfig | null>(null);
  const [quantity, setQuantity] = useState(LICENSE_MIN_QUANTITY);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getLicenseShopConfig()
      .then(setConfig)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load shop');
      });
  }, []);

  const maxQuantity = config?.maxQuantity ?? LICENSE_MIN_QUANTITY;
  const unitPriceCents = config?.unitPriceCents ?? LICENSE_UNIT_PRICE_CENTS;
  const totalCents = unitPriceCents * quantity;

  const handlePurchase = async () => {
    if (!config?.enabled || loading) return;
    setLoading(true);
    setError('');
    try {
      const { url } = await createLicenseCheckout(quantity);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setLoading(false);
    }
  };

  return (
    <Modal title="Get a License" onClose={onClose}>
      <p className="shop-lead">
        Each license is a <strong>one-time purchase</strong> that unlocks expanded and custom word sets for one account forever.
        Buy extra licenses to share with others.
      </p>

      <div className="shop-price-row">
        <span className="shop-price-label">Price per license</span>
        <span className="shop-price-value">{formatUsd(unitPriceCents)}</span>
      </div>

      <label className="input-label" htmlFor="license-quantity">Quantity</label>
      <div className="number-input shop-quantity">
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(LICENSE_MIN_QUANTITY, q - 1))}
          disabled={quantity <= LICENSE_MIN_QUANTITY || loading}
        >
          −
        </button>
        <span className="number-input-value" id="license-quantity">{quantity}</span>
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
          disabled={quantity >= maxQuantity || loading}
        >
          +
        </button>
      </div>

      <div className="shop-total">
        Total: <strong>{formatUsd(totalCents)}</strong>
      </div>

      {!config && !error && <p className="muted">Loading shop…</p>}

      {config && !config.enabled && (
        <p className="info-msg">Online purchases are not available yet. Check back soon.</p>
      )}

      {error && <p className="error-msg">{error}</p>}

      <div className="modal-actions">
        <button type="button" className="btn" onClick={onClose} disabled={loading}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handlePurchase}
          disabled={!config?.enabled || loading}
        >
          {loading ? 'Redirecting…' : 'Continue to Checkout'}
        </button>
      </div>
    </Modal>
  );
}
