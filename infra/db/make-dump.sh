#!/usr/bin/env bash
# Tao lai file dump tu DB dang chay (sau khi backend da chay Flyway).
# Chay lai script nay moi khi them/sua migration, roi commit file dump moi.
set -euo pipefail
cd "$(dirname "$0")/.."

OUT=db/init/01-care.sql.gz
docker compose exec -T postgres pg_dump -U care -d care --no-owner --no-privileges | gzip -9 > "$OUT"
echo "Da tao $OUT ($(du -h "$OUT" | cut -f1))"
