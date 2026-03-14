/* global process */
import pg from 'pg';

const { Pool } = pg;

const rawConnectionString =
  process.env.DATABASE_URL ||
  process.env.NETLIFY_DATABASE_URL;

if (!rawConnectionString) {
  throw new Error('DATABASE_URL (or NETLIFY_DATABASE_URL) is not set');
}

// Detect SSL requirement from connection string
const sslRequired = /sslmode=require|ssl=true/i.test(rawConnectionString);

// Remove sslmode/ssl params from URL to avoid conflict with explicit ssl option
// (pg v8 ignores ssl config option when sslmode is present in connection string)
let connectionString = rawConnectionString;
if (sslRequired) {
  try {
    const url = new URL(rawConnectionString);
    url.searchParams.delete('sslmode');
    url.searchParams.delete('ssl');
    connectionString = url.toString();
  } catch {
    connectionString = rawConnectionString;
  }
}

const ssl = sslRequired ? { rejectUnauthorized: false } : false;

export const pool = new Pool({
  connectionString,
  ssl,
  max: 3, // small pool is enough for Netlify functions
  connectionTimeoutMillis: 5_000,
  idleTimeoutMillis: 10_000,
});

export const query = (text, params) => pool.query(text, params);
