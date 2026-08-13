#!/bin/sh
set -e

# Self-host quick start: BETTER_AUTH_SECRET/ADMIN_PASSWORD are optional at the
# `docker compose` level. Generate strong random values on first boot and persist
# them on the /app/data volume — restarts must not rotate BETTER_AUTH_SECRET (it
# encrypts stored OAuth tokens) or change the bootstrapped admin's password.
# An explicit env var always wins over a persisted/generated one.
SECRETS_FILE=/app/data/secrets.env
mkdir -p /app/data
[ -f "$SECRETS_FILE" ] && . "$SECRETS_FILE"

if [ -z "$BETTER_AUTH_SECRET" ]; then
  BETTER_AUTH_SECRET=$(openssl rand -hex 32)
  echo "BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET" >> "$SECRETS_FILE"
  echo "[ScopeGate] Generated BETTER_AUTH_SECRET (persisted to $SECRETS_FILE)"
fi

if [ -z "$ADMIN_PASSWORD" ]; then
  ADMIN_PASSWORD=$(openssl rand -hex 12)
  echo "ADMIN_PASSWORD=$ADMIN_PASSWORD" >> "$SECRETS_FILE"
  echo ""
  echo "=========================================================="
  echo " First run: generated admin login"
  echo "   email:    ${ADMIN_EMAIL:-admin@scopegate.local}"
  echo "   password: $ADMIN_PASSWORD"
  echo " (also saved to $SECRETS_FILE inside the app_data volume)"
  echo "=========================================================="
  echo ""
fi

export BETTER_AUTH_SECRET ADMIN_PASSWORD

echo "Running database migrations..."
# Run from /prisma-runtime so prisma auto-loads /prisma-runtime/prisma.config.ts
# (which carries the datasource url; the schema itself has none).
cd /prisma-runtime
./node_modules/.bin/prisma migrate deploy

echo "Starting application..."
cd /app
exec node server.js
