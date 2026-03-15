import { createQuery } from '../_db/client.js';
import { refreshAccessToken } from '../_lib/google.js';

async function getAccessTokenForUser(env, google_sub) {
  const query = createQuery(env);
  const { rows } = await query(
    'SELECT refresh_token FROM user_tokens WHERE google_sub = $1',
    [google_sub],
  );
  if (!rows.length) throw new Error('User not found');
  return refreshAccessToken(env, rows[0].refresh_token);
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const { google_sub, range } = await request.json();
  if (!google_sub || !range) {
    return new Response(JSON.stringify({ error: 'Missing google_sub or range' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const accessToken = await getAccessTokenForUser(env, google_sub);

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${env.VITE_GOOGLE_SHEET_ID}/values/${encodeURIComponent(range)}?majorDimension=ROWS`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();

    return new Response(JSON.stringify({ values: data.values }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Sheets read error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to read sheet', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
