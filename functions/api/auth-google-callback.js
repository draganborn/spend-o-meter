import { google } from 'googleapis';
import { createQuery } from '../_db/client.js';

export async function onRequestGet(context) {
  const { request, env } = context;

  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('Missing authorization code', { status: 400 });
  }

  const GOOGLE_CLIENT_ID = env.VITE_GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET;
  const REDIRECT_URI = `${env.URL}/api/auth-google-callback`;

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    REDIRECT_URI,
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    const { refresh_token } = tokens;

    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    const google_sub = userInfo.sub || userInfo.id;
    const { email, name, picture, given_name, family_name } = userInfo;

    if (refresh_token && google_sub) {
      const query = createQuery(env);
      await query(
        `INSERT INTO user_tokens (google_sub, email, refresh_token, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (google_sub)
         DO UPDATE SET
           refresh_token = EXCLUDED.refresh_token,
           email = EXCLUDED.email,
           updated_at = NOW()`,
        [google_sub, email, refresh_token],
      );
    }

    const sessionPayload = { google_sub, email, name, picture, given_name, family_name };

    return new Response(JSON.stringify({ success: true, user: sessionPayload }), {
      status: 302,
      headers: {
        Location: `${env.URL}/?auth=${encodeURIComponent(JSON.stringify(sessionPayload))}`,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to complete authentication', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
