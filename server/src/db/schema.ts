import { bigint, integer, pgTable, text } from 'drizzle-orm/pg-core';

export const licenses = pgTable('licenses', {
  key: text('key').primaryKey(),
  icon: text('icon'),
  activatedBy: text('activated_by'),
  activatedAt: bigint('activated_at', { mode: 'number' }),
});

export const licenseAttempts = pgTable('license_attempts', {
  playerId: text('player_id').primaryKey(),
  attempts: integer('attempts').notNull().default(0),
  lockedUntil: bigint('locked_until', { mode: 'number' }),
});

export const customWordSets = pgTable('custom_word_sets', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  words: text('words').notNull(),
  ownerId: text('owner_id').notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});

/** Reserved for Clerk integration (Phase 2). */
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  clerkUserId: text('clerk_user_id').unique(),
  email: text('email'),
  displayName: text('display_name'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});

/** Reserved for Stripe integration (Phase 4). */
export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  plan: text('plan').notNull(),
  status: text('status').notNull(),
  stripeSubscriptionId: text('stripe_subscription_id'),
  expiresAt: bigint('expires_at', { mode: 'number' }),
});
