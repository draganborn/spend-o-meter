export async function onRequestGet(context) {
  const { env } = context;
  const GOOGLE_CLIENT_ID = env.VITE_GOOGLE_CLIENT_ID;
  const REDIRECT_URI = `${env.URL}/api/auth-google-callback`;
  const SCOPES = 'openid profile email https://www.googleapis.com/auth/spreadsheets';

  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(SCOPES)}&` +
    `access_type=offline&` +
    `prompt=consent`;

  return new Response('Redirecting to Google OAuth...', {
    status: 302,
    headers: {
      Location: authUrl,
      'Content-Type': 'text/plain',
    },
  });
}
