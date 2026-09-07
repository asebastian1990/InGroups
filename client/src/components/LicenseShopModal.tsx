import { useEffect, useState } from 'react';
import { LICENSE_MIN_QUANTITY, LICENSE_MAX_QUANTITY, LICENSE_UNIT_PRICE_CENTS } from '@shared/types';
import { createLicenseCheckout, getLicenseShopConfig, type LicenseShopConfig } from '../api';
import { Modal } from './UI';

interface Props {
  onClose: () => void;
}

function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

function clampQuantity(value: number, max: number): number {
  return Math.min(max, Math.max(LICENSE_MIN_QUANTITY, value));
}

function parseQuantityText(text: string): number {
  const parsed = Number.parseInt(text.trim(), 10);
  return Number.isFinite(parsed) ? parsed : LICENSE_MIN_QUANTITY;
}

export function LicenseShopModal({ onClose }: Props) {
  const [config, setConfig] = useState<LicenseShopConfig | null>(null);
  const [quantityText, setQuantityText] = useState(String(LICENSE_MIN_QUANTITY));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getLicenseShopConfig()
      .then(setConfig)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load shop');
      });
  }, []);

  const maxQuantity = config?.maxQuantity ?? LICENSE_MAX_QUANTITY;
  const unitPriceCents = config?.unitPriceCents ?? LICENSE_UNIT_PRICE_CENTS;
  const quantity = clampQuantity(parseQuantityText(quantityText), maxQuantity);
  const totalCents = unitPriceCents * quantity;

  const commitQuantity = () => {
    setQuantityText(String(clampQuantity(parseQuantityText(quantityText), maxQuantity)));
  };

  const handlePurchase = async () => {
    if (!config?.enabled || loading) return;
    const checkoutQuantity = clampQuantity(parseQuantityText(quantityText), maxQuantity);
    setQuantityText(String(checkoutQuantity));
    setLoading(true);
    setError('');
    try {
      const { url } = await createLicenseCheckout(checkoutQuantity);
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
          onClick={() => setQuantityText(String(clampQuantity(quantity - 1, maxQuantity)))}
          disabled={quantity <= LICENSE_MIN_QUANTITY || loading}
        >
          −
        </button>
        <input
          id="license-quantity"
          className="number-input-field"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={quantityText}
          onChange={(e) => setQuantityText(e.target.value.replace(/\D/g, ''))}
          onBlur={commitQuantity}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              commitQuantity();
              (e.target as HTMLInputElement).blur();
            }
          }}
          disabled={loading}
          aria-label="License quantity"
        />
        <button
          type="button"
          onClick={() => setQuantityText(String(clampQuantity(quantity + 1, maxQuantity)))}
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
