import { createQuery } from '../_db/client.js';
import { exchangeCodeForTokens, getUserInfo } from '../_lib/google.js';

export async function onRequestGet(context) {
  const { request, env } = context;

  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('Missing authorization code', { status: 400 });
  }

  try {
    const tokens = await exchangeCodeForTokens(env, code);
    const { access_token, refresh_token } = tokens;

    const userInfo = await getUserInfo(access_token);
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
