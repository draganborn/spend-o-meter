export async function onRequest() {
  return new Response('Logging out...', {
    status: 302,
    headers: {
      Location: '/',
      'Set-Cookie': 'auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax',
      'Content-Type': 'text/plain',
    },
  });
}
