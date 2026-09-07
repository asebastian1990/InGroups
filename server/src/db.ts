import './env.js';
import { and, count, eq } from 'drizzle-orm';
import { FREE_WORD_SETS, type WordSet } from '../../shared/types.js';
import { db } from './db/client.js';
import { ensureSchema } from './db/migrate.js';
import { customWordSets, licenseAttempts, licenses, users } from './db/schema.js';
import { generateUniqueLicenseKey } from './licenses.js';

export {
  createPendingLicenseOrder,
  fulfillLicenseOrder,
  generateUniqueLicenseKey,
  generateUniqueLicenseKeys,
  getLicensePurchaseSummary,
  getLicenseOrder,
  getLicenseOrderByStripeSession,
  attachStripeSessionToOrder,
  clampLicenseQuantity,
} from './licenses.js';

export async function initDb() {
  await ensureSchema();

  const [{ value: licenseCount }] = await db.select({ value: count() }).from(licenses);

  if (licenseCount === 0) {
    const now = Date.now();
    const seedKeys = await Promise.all(
      Array.from({ length: 5 }, async () => generateUniqueLicenseKey())
    );
    await db.insert(licenses).values(
      seedKeys.map((key) => ({
        key,
        icon: '',
        createdAt: now,
      }))
    );
  }

  const keys = await db.select().from(licenses);
  console.log('\n📋 Available license keys:');
  keys.forEach((k) => console.log(`  ${k.key}${k.activatedBy ? ' (activated)' : ''}`));
  console.log('');
}

export async function getWordSets(hasLicense: boolean, ownerId?: string): Promise<WordSet[]> {
  const sets = FREE_WORD_SETS.filter((s) => !s.isPremium || hasLicense);
  if (ownerId) {
    const custom = await db
      .select()
      .from(customWordSets)
      .where(eq(customWordSets.ownerId, ownerId));
    for (const row of custom) {
      sets.push({
        id: row.id,
        name: row.name,
        words: JSON.parse(row.words),
        isPremium: false,
        isCustom: true,
        ownerId: row.ownerId,
      });
    }
  }
  return sets;
}

export async function getWordSetWords(wordSetId: string, ownerId?: string): Promise<string[] | null> {
  const builtIn = FREE_WORD_SETS.find((s) => s.id === wordSetId);
  if (builtIn) return builtIn.words;

  if (ownerId) {
    const [owned] = await db
      .select({ words: customWordSets.words })
      .from(customWordSets)
      .where(and(eq(customWordSets.id, wordSetId), eq(customWordSets.ownerId, ownerId)));
    if (owned) return JSON.parse(owned.words);
  }

  const [any] = await db
    .select({ words: customWordSets.words })
    .from(customWordSets)
    .where(eq(customWordSets.id, wordSetId));
  return any ? JSON.parse(any.words) : null;
}

export async function saveCustomWordSet(id: string, name: string, words: string[], ownerId: string) {
  await db
    .insert(customWordSets)
    .values({
      id,
      name,
      words: JSON.stringify(words),
      ownerId,
      createdAt: Date.now(),
    })
    .onConflictDoUpdate({
      target: customWordSets.id,
      set: {
        name,
        words: JSON.stringify(words),
        ownerId,
        createdAt: Date.now(),
      },
    });
}

export async function deleteCustomWordSet(id: string, ownerId: string) {
  await db
    .delete(customWordSets)
    .where(and(eq(customWordSets.id, id), eq(customWordSets.ownerId, ownerId)));
}

export async function validateLicense(
  key: string,
  playerId: string
): Promise<{ valid: boolean; error?: string }> {
  const [attempts] = await db
    .select()
    .from(licenseAttempts)
    .where(eq(licenseAttempts.playerId, playerId));

  if (attempts?.lockedUntil && attempts.lockedUntil > Date.now()) {
    return { valid: false, error: 'Too many failed attempts. Try again tomorrow.' };
  }

  const existing = await getPlayerLicense(playerId);
  if (existing) {
    return { valid: true };
  }

  const [license] = await db.select().from(licenses).where(eq(licenses.key, key));

  if (!license) {
    const currentAttempts = (attempts?.attempts ?? 0) + 1;
    if (currentAttempts >= 3) {
      const tomorrow = new Date();
      tomorrow.setHours(24, 0, 0, 0);
      await db
        .insert(licenseAttempts)
        .values({ playerId, attempts: 0, lockedUntil: tomorrow.getTime() })
        .onConflictDoUpdate({
          target: licenseAttempts.playerId,
          set: { attempts: 0, lockedUntil: tomorrow.getTime() },
        });
      return { valid: false, error: 'Too many failed attempts. Locked out until tomorrow.' };
    }
    await db
      .insert(licenseAttempts)
      .values({ playerId, attempts: currentAttempts, lockedUntil: null })
      .onConflictDoUpdate({
        target: licenseAttempts.playerId,
        set: { attempts: currentAttempts, lockedUntil: null },
      });
    return { valid: false, error: `Invalid license key. ${3 - currentAttempts} attempts remaining.` };
  }

  if (license.activatedBy && license.activatedBy !== playerId) {
    return { valid: false, error: 'This license key is already in use.' };
  }

  await db
    .update(licenses)
    .set({ activatedBy: playerId, activatedAt: Date.now() })
    .where(eq(licenses.key, key));
  await db.delete(licenseAttempts).where(eq(licenseAttempts.playerId, playerId));
  return { valid: true };
}

export async function getPlayerLicense(playerId: string): Promise<{ key: string } | null> {
  const [license] = await db.select().from(licenses).where(eq(licenses.activatedBy, playerId));
  return license ? { key: license.key } : null;
}

export async function generateNewLicense(): Promise<string> {
  const key = await generateUniqueLicenseKey();
  await db.insert(licenses).values({ key, icon: '', createdAt: Date.now() });
  return key;
}

export async function ensureUser(
  clerkUserId: string,
  email?: string | null
): Promise<{ id: string; clerkUserId: string }> {
  const [existing] = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId));
  if (existing) {
    if (email && !existing.email) {
      await db.update(users).set({ email }).where(eq(users.id, existing.id));
    }
    return { id: existing.id, clerkUserId: existing.clerkUserId! };
  }

  const id = crypto.randomUUID();
  await db.insert(users).values({
    id,
    clerkUserId,
    email: email ?? null,
    displayName: null,
    createdAt: Date.now(),
  });
  return { id, clerkUserId };
}
