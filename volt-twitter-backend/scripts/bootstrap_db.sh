#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
ROOT_DIR=$(dirname "$SCRIPT_DIR")

cd "$ROOT_DIR"

if [ ! -f .env ]; then
  echo "Missing .env file. Copy .env.example -> .env and set DATABASE_URL before running this script." >&2
  exit 1
fi

echo "[bootstrap] Ensuring Postgres database exists and has correct permissions..."
"$SCRIPT_DIR"/setup_local_db.sh

echo "[bootstrap] Applying Prisma migrations..."
npx prisma migrate deploy --schema prisma/schema.prisma

echo "[bootstrap] Seeding database with demo data..."
npm run seed

CHAR_SERVICE_DIR="$ROOT_DIR/../volt-character-service"
if [ -d "$CHAR_SERVICE_DIR" ]; then
  echo "[bootstrap] Applying character service migrations..."
  (cd "$CHAR_SERVICE_DIR" && npx prisma migrate deploy --schema prisma/schema.prisma)

  echo "[bootstrap] Seeding characters..."
  (cd "$CHAR_SERVICE_DIR" && npm run seed)

  echo "[bootstrap] Priming character activation windows..."
  (cd "$CHAR_SERVICE_DIR" && npm run prime:activations)
else
  echo "[bootstrap] Character service directory not found, skipping character migrations/seed."
fi

echo "[bootstrap] Database ready."
