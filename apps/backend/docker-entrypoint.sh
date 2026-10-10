#!/bin/sh
set -e

echo "Running Prisma database migrations..."
npx prisma migrate deploy

echo "Seeding initial demo data (if database is empty)..."
npx tsx prisma/seed.ts || echo "Seeding skipped or already populated."
echo "Starting Node.js Express backend server..."
exec node dist/server.js
