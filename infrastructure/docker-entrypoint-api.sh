#!/bin/sh
set -e

echo "[Docker Entrypoint] Starting MikroTik ISP Billing API..."

# Wait for database if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
  echo "[Docker Entrypoint] Running database migrations (Prisma Deploy)..."
  pnpm --filter @mikrotik-billing/database run db:deploy || {
    echo "[Docker Entrypoint] Migration failed, waiting 3 seconds before retry..."
    sleep 3
    pnpm --filter @mikrotik-billing/database run db:deploy
  }
  
  if [ "$SEED_DATABASE" = "true" ]; then
    echo "[Docker Entrypoint] SEED_DATABASE is true. Seeding database..."
    pnpm --filter @mikrotik-billing/database run db:seed || true
  fi
fi

echo "[Docker Entrypoint] Starting API application..."
exec "$@"
