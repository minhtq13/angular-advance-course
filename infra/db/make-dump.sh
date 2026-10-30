#!/usr/bin/env bash
# Tạo lại file dump từ DB đang chạy (sau khi backend đã chạy Flyway).
# Chạy lại script này mỗi khi thêm/sửa migration, rồi commit file dump mới.
set -euo pipefail
cd "$(dirname "$0")/.."

OUT=db/init/01-care.sql.gz
docker compose exec -T postgres pg_dump -U care -d care --no-owner --no-privileges | gzip -9 > "$OUT"
echo "Da tao $OUT ($(du -h "$OUT" | cut -f1))"
