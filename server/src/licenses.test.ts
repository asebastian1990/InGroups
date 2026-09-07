import { describe, expect, it } from 'vitest';
import { clampLicenseQuantity, formatLicenseKey, randomLicenseKeyParts } from './licenses.js';

describe('license key helpers', () => {
  it('formats keys with dashes', () => {
    expect(formatLicenseKey(['A1B2', 'C3D4', 'E5F6', '7890', 'ABCD'])).toBe(
      'A1B2-C3D4-E5F6-7890-ABCD'
    );
  });

  it('generates five hex parts', () => {
    const parts = randomLicenseKeyParts();
    expect(parts).toHaveLength(5);
    for (const part of parts) {
      expect(part).toMatch(/^[0-9A-F]{4}$/);
    }
  });

  it('clamps purchase quantity', () => {
    expect(clampLicenseQuantity(0)).toBe(1);
    expect(clampLicenseQuantity(3)).toBe(3);
    expect(clampLicenseQuantity(99)).toBe(10);
  });
});
