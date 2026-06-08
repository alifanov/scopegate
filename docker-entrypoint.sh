#!/bin/sh
set -e

echo "Running database migrations..."
# Run from /prisma-runtime so prisma auto-loads /prisma-runtime/prisma.config.ts
# (which carries the datasource url; the schema itself has none).
cd /prisma-runtime
./node_modules/.bin/prisma migrate deploy

echo "Starting application..."
cd /app
exec node server.js
