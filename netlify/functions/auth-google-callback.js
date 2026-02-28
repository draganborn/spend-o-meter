import { google } from 'googleapis';
import { neon } from '@neondatabase/serverless';

const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.URL}/.netlify/functions/auth-google-callback`;

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI,
);

const sql = neon(process.env.NETLIFY_DATABASE_URL);

export async function handler(event) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { code, state } = event.queryStringParameters;
  if (!code) {
    return { statusCode: 400, body: 'Missing authorization code' };
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    const { refresh_token, access_token } = tokens;

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();
    const { sub: google_sub, email, name, picture, given_name, family_name } = userInfo;

    // Upsert refresh token in Neon DB
    await sql`
      INSERT INTO user_tokens (google_sub, email, refresh_token, updated_at)
      VALUES (${google_sub}, ${email}, ${refresh_token}, NOW())
      ON CONFLICT (google_sub)
      DO UPDATE SET
        refresh_token = EXCLUDED.refresh_token,
        email = EXCLUDED.email,
        updated_at = NOW()
    `;

    // Return user info + a simple session token (could be JWT later)
    const sessionPayload = {
      google_sub,
      email,
      name,
      picture,
      given_name,
      family_name,
    };

    // For simplicity, we'll use a short-lived signed cookie or just return JSON.
    // In production, consider issuing a proper JWT.
    const response = {
      statusCode: 302,
      headers: {
        Location: `${process.env.URL}/?auth=${encodeURIComponent(JSON.stringify(sessionPayload))}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ success: true, user: sessionPayload }),
    };

    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to complete authentication' }),
    };
  }
}
