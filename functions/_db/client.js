import pg from 'pg';

const { Pool } = pg;

export function createQuery(env) {
  const rawConnectionString = env.DATABASE_URL;

  if (!rawConnectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const sslRequired = /sslmode=require|ssl=true/i.test(rawConnectionString);

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

  const pool = new Pool({
    connectionString,
    ssl,
    max: 1,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 10_000,
  });

  return (text, params) => pool.query(text, params);
}
