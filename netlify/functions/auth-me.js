export async function handler() {
  // In a real implementation, you'd verify a JWT/session cookie and return user info
  // For now, this stub can be used to check if a session exists
  return {
    statusCode: 200,
    body: JSON.stringify({ user: null, message: 'No active session' }),
  };
}
