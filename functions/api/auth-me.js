export async function onRequestGet() {
  return new Response(
    JSON.stringify({ user: null, message: 'No active session' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}
