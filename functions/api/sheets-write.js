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

  const { google_sub, range, values } = await request.json();
  if (!google_sub || !range || !values) {
    return new Response(JSON.stringify({ error: 'Missing google_sub, range, or values' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const accessToken = await getAccessTokenForUser(env, google_sub);
    const sheetId = env.VITE_GOOGLE_SHEET_ID;
    const encodedRange = encodeURIComponent(range);
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodedRange}:clear`,
      { method: 'POST', headers: authHeader },
    );

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodedRange}?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values, majorDimension: 'ROWS' }),
      },
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Sheets write error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to write sheet', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
