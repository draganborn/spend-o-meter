/* global process */
import pg from 'pg';

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  process.env.NETLIFY_DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL (or NETLIFY_DATABASE_URL) is not set');
}

// Enable SSL if explicitly requested in the connection string (e.g., sslmode=require)
const ssl =
  /sslmode=require|ssl=true/i.test(connectionString)
    ? { rejectUnauthorized: false }
    : false;

export const pool = new Pool({
  connectionString,
  ssl,
  max: 3, // small pool is enough for Netlify functions
  connectionTimeoutMillis: 5_000,
  idleTimeoutMillis: 10_000,
});

export const query = (text, params) => pool.query(text, params);
