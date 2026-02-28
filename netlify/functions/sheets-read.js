import { google } from 'googleapis';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NETLIFY_DATABASE_URL);

// Helper: get fresh access token via refresh token
async function getAccessTokenForUser(google_sub) {
  const rows = await sql`SELECT refresh_token FROM user_tokens WHERE google_sub = ${google_sub}`;
  if (!rows.length) throw new Error('User not found');
  const { refresh_token } = rows[0];

  const oauth2Client = new google.auth.OAuth2Client(
    process.env.VITE_GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  oauth2Client.setCredentials({ refresh_token });

  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials.access_token;
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { google_sub, range } = JSON.parse(event.body);
  if (!google_sub || !range) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing google_sub or range' }) };
  }

  try {
    const accessToken = await getAccessTokenForUser(google_sub);
    const sheets = google.sheets({ version: 'v4', auth: accessToken });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.VITE_GOOGLE_SHEET_ID,
      range,
      majorDimension: 'ROWS',
    });
    return {
      statusCode: 200,
      body: JSON.stringify({ values: response.data.values }),
    };
  } catch (error) {
    console.error('Sheets read error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to read sheet', details: error.message }),
    };
  }
}
