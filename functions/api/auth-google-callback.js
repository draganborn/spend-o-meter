import { createSupabaseClient } from '../_db/client.js';
import { exchangeCodeForTokens, getUserInfo } from '../_lib/google.js';

export async function onRequestGet(context) {
  const { request, env } = context;

  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('Missing authorization code', { status: 400 });
  }

  const redirectUri = `${url.origin}/api/auth-google-callback`;

  try {
    const tokens = await exchangeCodeForTokens(env, code, redirectUri);
    const { access_token, refresh_token } = tokens;

    const userInfo = await getUserInfo(access_token);
    const google_sub = userInfo.sub || userInfo.id;
    const { email, name, picture, given_name, family_name } = userInfo;

    if (refresh_token && google_sub) {
      const supabase = createSupabaseClient(env);
      await supabase.from('user_tokens').upsert(
        { google_sub, email, refresh_token, updated_at: new Date().toISOString() },
        { onConflict: 'google_sub' },
      );
    }

    const sessionPayload = { google_sub, email, name, picture, given_name, family_name };

    return new Response(JSON.stringify({ success: true, user: sessionPayload }), {
      status: 302,
      headers: {
        Location: `${url.origin}/?auth=${encodeURIComponent(JSON.stringify(sessionPayload))}`,
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
