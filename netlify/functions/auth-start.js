const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URI = `${process.env.URL}/.netlify/functions/auth-google-callback`;
const SCOPES = 'openid profile email https://www.googleapis.com/auth/spreadsheets';

export async function handler(event) {
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(SCOPES)}&` +
    `access_type=offline&` + // important to get refresh token
    `prompt=consent`;

  return {
    statusCode: 302,
    headers: {
      Location: authUrl,
      'Content-Type': 'text/plain',
    },
    body: 'Redirecting to Google OAuth...',
  };
}
