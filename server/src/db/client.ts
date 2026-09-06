import '../env.js';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set. Add it to .env in the project root.');
  }
  return url;
}

const pool = new pg.Pool({
  connectionString: requireDatabaseUrl(),
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });
