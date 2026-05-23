#!/bin/sh
# =============================================================================
# Backend container entrypoint
# Runs on every container start (before the main CMD).
#
# 1. prisma generate — creates the Prisma Client for SQLite
# 2. prisma migrate deploy — applies pending migrations (creates DB if missing)
# 3. exec CMD — starts ts-node (dev) or node (production)
# =============================================================================
set -e

echo "[entrypoint] Ensuring data directory exists..."
mkdir -p /app/data

echo "[entrypoint] Prisma generate..."
npx prisma generate

echo "[entrypoint] Prisma migrate deploy..."
npx prisma migrate deploy

echo "[entrypoint] Starting application: $*"
exec "$@"
