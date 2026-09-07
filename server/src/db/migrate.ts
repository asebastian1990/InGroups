import { sql } from 'drizzle-orm';
import { db } from './client.js';

/** Apply schema changes idempotently (safe to run on every boot). */
export async function ensureSchema() {
  await db.execute(sql`
    ALTER TABLE licenses ADD COLUMN IF NOT EXISTS purchased_by text
  `);
  await db.execute(sql`
    ALTER TABLE licenses ADD COLUMN IF NOT EXISTS order_id text
  `);
  await db.execute(sql`
    ALTER TABLE licenses ADD COLUMN IF NOT EXISTS created_at bigint
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS license_orders (
      id text PRIMARY KEY,
      buyer_clerk_id text NOT NULL,
      quantity integer NOT NULL,
      unit_price_cents integer NOT NULL,
      stripe_session_id text UNIQUE,
      status text NOT NULL DEFAULT 'pending',
      created_at bigint NOT NULL,
      completed_at bigint
    )
  `);
}
