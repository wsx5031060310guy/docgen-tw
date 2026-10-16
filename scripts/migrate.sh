#!/bin/sh
# Apply Prisma migrations. Until 2026-10-16 the production database was managed
# with `prisma db push` and has no migration history, which `migrate deploy`
# reports as P3005. Only in that case, record 0_init (the db-push schema) as
# applied and deploy again. Every other failure fails the build.
out=$(prisma migrate deploy 2>&1)
rc=$?
echo "$out"
[ "$rc" -eq 0 ] && exit 0
echo "$out" | grep -q P3005 || exit "$rc"
prisma migrate resolve --applied 0_init && prisma migrate deploy
