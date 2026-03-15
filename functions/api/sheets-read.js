import { google } from 'googleapis';
import { createQuery } from '../_db/client.js';

async function getAccessTokenForUser(env, google_sub) {
  const query = createQuery(env);
  const { rows } = await query(
    'SELECT refresh_token FROM user_tokens WHERE google_sub = $1',
    [google_sub],
  );
  if (!rows.length) throw new Error('User not found');
  const { refresh_token } = rows[0];

  const oauth2Client = new google.auth.OAuth2(
    env.VITE_GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
  );
  oauth2Client.setCredentials({ refresh_token });

  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials.access_token;
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

    const oauth2Client = new google.auth.OAuth2(
      env.VITE_GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
    );
    oauth2Client.setCredentials({ access_token: accessToken });

    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: env.VITE_GOOGLE_SHEET_ID,
      range,
      majorDimension: 'ROWS',
    });

    return new Response(JSON.stringify({ values: response.data.values }), {
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
