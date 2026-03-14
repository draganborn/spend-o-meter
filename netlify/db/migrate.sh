#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$ROOT_DIR/migrations"

DB_URL="${DATABASE_URL:-${NETLIFY_DATABASE_URL:-}}"

if [[ -z "${DB_URL}" ]]; then
  echo "DATABASE_URL (or NETLIFY_DATABASE_URL) is not set" >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql not found. Install PostgreSQL client first." >&2
  exit 1
fi

echo "Applying migrations in $MIGRATIONS_DIR ..."
for file in $(ls "$MIGRATIONS_DIR"/*.sql | sort); do
  echo "-> $file"
  PGPASSWORD="" psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$file"
done

echo "Migrations applied."
