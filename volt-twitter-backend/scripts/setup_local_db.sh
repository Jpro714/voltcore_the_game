#!/usr/bin/env bash
set -euo pipefail

DB_NAME="volt_twitter"

choose_user() {
  local candidates=()
  if [ -n "${PGUSER:-}" ]; then
    candidates+=("$PGUSER")
  fi
  candidates+=("postgres" "$(whoami)")

  for user in "${candidates[@]}"; do
    if psql --username "$user" --dbname postgres -c '\q' >/dev/null 2>&1; then
      echo "$user"
      return 0
    fi
  done

  return 1
}

DB_USER="$(choose_user)" || {
  echo "Could not connect to Postgres with PGUSER, 'postgres', or $(whoami)." >&2
  echo "Set PGUSER/PGPASSWORD to a valid role and re-run." >&2
  exit 1
}

EXISTS=$(psql --username "$DB_USER" --tuples-only --no-align --dbname postgres -c "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}';" | tr -d '[:space:]')
if [ "$EXISTS" != "1" ]; then
  createdb --username "$DB_USER" "$DB_NAME"
fi

psql --username "$DB_USER" --dbname "$DB_NAME" <<SQL
ALTER SCHEMA public OWNER TO "$DB_USER";
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO "$DB_USER";
GRANT ALL PRIVILEGES ON SCHEMA public TO "$DB_USER";
SQL

echo "Database $DB_NAME ready for Prisma (connected as $DB_USER)."
