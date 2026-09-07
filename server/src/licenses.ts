import { randomBytes } from 'crypto';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import {
  LICENSE_MAX_QUANTITY,
  LICENSE_MIN_QUANTITY,
  LICENSE_UNIT_PRICE_CENTS,
  type LicensePurchaseSummary,
  type PurchasedLicenseKey,
} from '../../shared/types.js';
import { db } from './db/client.js';
import { licenseOrders, licenses } from './db/schema.js';

export function formatLicenseKey(parts: string[]): string {
  return parts.join('-');
}

export function randomLicenseKeyParts(): string[] {
  const parts: string[] = [];
  for (let i = 0; i < 5; i++) {
    parts.push(randomBytes(2).toString('hex').toUpperCase());
  }
  return parts;
}

export function randomLicenseKey(): string {
  return formatLicenseKey(randomLicenseKeyParts());
}

async function licenseKeyExists(key: string): Promise<boolean> {
  const [row] = await db.select({ key: licenses.key }).from(licenses).where(eq(licenses.key, key));
  return !!row;
}

export async function generateUniqueLicenseKey(): Promise<string> {
  for (let attempt = 0; attempt < 32; attempt++) {
    const key = randomLicenseKey();
    if (!(await licenseKeyExists(key))) {
      return key;
    }
  }
  throw new Error('Failed to generate a unique license key');
}

export async function generateUniqueLicenseKeys(count: number): Promise<string[]> {
  const keys: string[] = [];
  for (let i = 0; i < count; i++) {
    keys.push(await generateUniqueLicenseKey());
  }
  return keys;
}

export function clampLicenseQuantity(quantity: number): number {
  const minQ = LICENSE_MIN_QUANTITY ?? 1;
  const maxQ = LICENSE_MAX_QUANTITY ?? 10;
  const n = Math.floor(Number(quantity));
  if (!Number.isFinite(n)) {
    return minQ;
  }
  return Math.max(minQ, Math.min(maxQ, n));
}

export async function createPendingLicenseOrder(
  buyerClerkId: string,
  quantity: number,
  unitPriceCents = LICENSE_UNIT_PRICE_CENTS
): Promise<{ orderId: string; quantity: number; unitPriceCents: number }> {
  const qty = clampLicenseQuantity(quantity);
  const orderId = uuidv4();
  const now = Date.now();

  await db.insert(licenseOrders).values({
    id: orderId,
    buyerClerkId,
    quantity: qty,
    unitPriceCents,
    status: 'pending',
    createdAt: now,
  });

  return { orderId, quantity: qty, unitPriceCents };
}

export async function attachStripeSessionToOrder(orderId: string, stripeSessionId: string): Promise<void> {
  await db
    .update(licenseOrders)
    .set({ stripeSessionId })
    .where(eq(licenseOrders.id, orderId));
}

export async function getLicenseOrder(orderId: string) {
  const [order] = await db.select().from(licenseOrders).where(eq(licenseOrders.id, orderId));
  return order ?? null;
}

export async function getLicenseOrderByStripeSession(stripeSessionId: string) {
  const [order] = await db
    .select()
    .from(licenseOrders)
    .where(eq(licenseOrders.stripeSessionId, stripeSessionId));
  return order ?? null;
}

export async function fulfillLicenseOrder(orderId: string): Promise<string[]> {
  const order = await getLicenseOrder(orderId);
  if (!order) {
    throw new Error('License order not found');
  }

  if (order.status === 'completed') {
    const existing = await db
      .select({ key: licenses.key })
      .from(licenses)
      .where(eq(licenses.orderId, orderId));
    return existing.map((row) => row.key);
  }

  const now = Date.now();
  const keys = await generateUniqueLicenseKeys(order.quantity);

  for (const key of keys) {
    await db.insert(licenses).values({
      key,
      icon: '',
      purchasedBy: order.buyerClerkId,
      orderId: order.id,
      createdAt: now,
    });
  }

  const [active] = await db
    .select({ key: licenses.key })
    .from(licenses)
    .where(eq(licenses.activatedBy, order.buyerClerkId));

  if (!active && keys.length > 0) {
    await db
      .update(licenses)
      .set({ activatedBy: order.buyerClerkId, activatedAt: now })
      .where(eq(licenses.key, keys[0]));
  }

  await db
    .update(licenseOrders)
    .set({ status: 'completed', completedAt: now })
    .where(eq(licenseOrders.id, orderId));

  return keys;
}

export async function getLicensePurchaseSummary(buyerClerkId: string): Promise<LicensePurchaseSummary> {
  const [active] = await db
    .select({ key: licenses.key })
    .from(licenses)
    .where(eq(licenses.activatedBy, buyerClerkId));

  const purchased = await db
    .select({
      key: licenses.key,
      activatedBy: licenses.activatedBy,
    })
    .from(licenses)
    .where(eq(licenses.purchasedBy, buyerClerkId))
    .orderBy(desc(licenses.createdAt));

  const purchasedKeys: PurchasedLicenseKey[] = purchased.map((row) => ({
    key: row.key,
    activated: !!row.activatedBy,
  }));

  return {
    activeLicense: active ? { key: active.key } : null,
    purchasedKeys,
  };
}

export async function listUnusedPurchasedKeys(buyerClerkId: string): Promise<string[]> {
  const rows = await db
    .select({ key: licenses.key })
    .from(licenses)
    .where(and(eq(licenses.purchasedBy, buyerClerkId), isNull(licenses.activatedBy)));
  return rows.map((row) => row.key);
}
