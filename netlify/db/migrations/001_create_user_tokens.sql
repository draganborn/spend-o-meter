-- Table to store per-user Google OAuth refresh tokens
CREATE TABLE IF NOT EXISTS user_tokens (
  id SERIAL PRIMARY KEY,
  google_sub TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookup by google_sub
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_tokens_google_sub ON user_tokens(google_sub);

-- Optional: index for email lookup (if needed)
CREATE INDEX IF NOT EXISTS idx_user_tokens_email ON user_tokens(email);
