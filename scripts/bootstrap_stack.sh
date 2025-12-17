#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
REPO_ROOT="$SCRIPT_DIR/.."
BACKEND_DIR="$REPO_ROOT/volt-twitter-backend"
CHAR_DIR="$REPO_ROOT/volt-character-service"
AMM_DIR="$REPO_ROOT/volt-amm-service"

require_env_file() {
  local dir=$1
  local file="$dir/.env"
  if [ ! -f "$file" ]; then
    echo "[bootstrap] Missing $file. Copy the .env.example file before running this script." >&2
    exit 1
  fi
}

require_env_file "$BACKEND_DIR"
if [ -d "$CHAR_DIR" ]; then
  require_env_file "$CHAR_DIR"
fi
if [ -d "$AMM_DIR" ]; then
  require_env_file "$AMM_DIR"
fi

echo "[bootstrap] Ensuring Postgres database exists..."
"$BACKEND_DIR/scripts/setup_local_db.sh"

echo "[bootstrap] Applying backend migrations..."
(cd "$BACKEND_DIR" && npx prisma migrate deploy --schema prisma/schema.prisma)

if [ -d "$CHAR_DIR" ]; then
  echo "[bootstrap] Applying character service migrations..."
  (cd "$CHAR_DIR" && npx prisma migrate deploy --schema prisma/schema.prisma)

  echo "[bootstrap] Clearing character ping queue..."
  (cd "$CHAR_DIR" && npx prisma db execute --schema prisma/schema.prisma --stdin <<< 'TRUNCATE TABLE "CharacterPing";')
else
  echo "[bootstrap] Character service directory not found; skipping character migrations."
fi

if [ -d "$AMM_DIR" ]; then
  echo "[bootstrap] Resetting AMM schema..."
  (cd "$AMM_DIR" && npx prisma migrate reset --schema prisma/schema.prisma --force --skip-generate --skip-seed >/dev/null)

  echo "[bootstrap] Applying AMM service migrations..."
  (cd "$AMM_DIR" && npx prisma migrate deploy --schema prisma/schema.prisma)
else
  echo "[bootstrap] AMM service directory not found; skipping AMM migrations."
fi

echo "[bootstrap] Seeding backend data..."
(cd "$BACKEND_DIR" && npm run seed)

if [ -d "$CHAR_DIR" ]; then
  echo "[bootstrap] Seeding character data..."
  (cd "$CHAR_DIR" && npm run seed)

  echo "[bootstrap] Priming character activation windows..."
  (cd "$CHAR_DIR" && npm run prime:activations)
fi

if [ -d "$AMM_DIR" ]; then
  echo "[bootstrap] Seeding AMM data..."
  (cd "$AMM_DIR" && npm run seed --silent)
fi

echo "[bootstrap] Database ready."
