---
name: kiem-tra-gate
description: Kiểm tra trước khi báo xong - gate frontend (lint, test, build), test backend, e2e với backend riêng, và chuỗi patch đáp án áp/gỡ khớp. Dùng sau mỗi thay đổi code hoặc patch.
argument-hint: "[frontend|backend|e2e|patch|all]"
---

# Kiểm tra gate

Mục tiêu: có bằng chứng chạy thật trước khi nói "xong". Test hỏng thì báo kèm output, không làm tròn.

## A. Gate frontend

```bash
cd frontend && source ~/.nvm/nvm.sh && nvm use
NX_DAEMON=false npx nx run-many -t lint test build --output-style=static > <scratchpad>/gate.log 2>&1; echo EXIT $?
grep -E "Successfully ran|Failed" <scratchpad>/gate.log
```

Phải pass **mọi project** (hiện 16). Không có `nvm use` thì Nx lỗi `require() of ES Module ... listr2`. Chạy từng lib: `npx nx test <project> --skip-nx-cache`.

## B. Test backend

VS Code (extension Java) ghi đè `backend/target/classes` làm `./mvnw test` lỗi `No qualifying bean ...Mapper`. Chạy trên bản sao:

```bash
rsync -a --delete --exclude target backend/ <scratchpad>/be && cd <scratchpad>/be && ./mvnw -q test
```

Cần Docker (Testcontainers). Chỉ biên dịch: `./mvnw -q -DskipTests test-compile`.

## C. E2E trên backend riêng (không đụng container của người dùng)

Không dừng cổng 4200/4300 và container `care-*` của người dùng. Dùng bộ riêng:

1. Postgres trống: `docker run -d --name care-tmp-pg -p 5434:5432 -e POSTGRES_DB=care -e POSTGRES_USER=care -e POSTGRES_PASSWORD=care postgres:16-alpine`.
2. Build jar trên bản sao (mục B), chạy nền: `DB_PORT=5434 PORT=8091 SEED_SUBSCRIBERS=2000 SEED_TICKETS=500 java -jar target/care-api-*.jar`
   (đợi `curl localhost:8091/actuator/health` = UP). Thêm biến demo cần thiết, vd `ACCESS_TOKEN_TTL=30s`.
3. `proxy.json` (CORS backend chỉ cho 4200/4300 nên proxy phải gửi `Origin`):
   `{"/api":{"target":"http://localhost:8091","secure":false,"changeOrigin":true,"headers":{"Origin":"http://localhost:4200"}}}`
4. Tạm đổi `frontend/apps/portal/public/config.json` thành `"apiUrl": "http://localhost:4210"` (**không commit**), rồi `nx serve portal --port 4210 --proxy-config proxy.json` chạy nền.
5. `BASE_URL=http://localhost:4210 API_URL=http://localhost:8091 npx playwright test -c apps/portal-e2e/playwright.config.mts --project=chromium --workers=1`.
   Spec tạm đặt tên `zz-*.spec.ts`. Ví dụ chờ token hết hạn: `ACCESS_TOKEN_TTL=30s` + chờ 45 giây (clock skew 10 giây).
6. **Dọn**: dừng tiến trình nền, `docker rm -f care-tmp-pg`, khôi phục `config.json`, xóa `zz-*.spec.ts`.

Dữ liệu seed nhỏ làm `i18n.spec` báo sai tổng số ("200,000"): không phải hồi quy. Dùng seed mặc định nếu cần đúng số.
`ticket-flow.spec` mỗi lần chạy đóng một phiếu RESOLVED và tạo một phiếu mới; Playwright đôi khi không thoát sau khi xong, chạy nền và đọc log.

## D. Chuỗi patch đáp án của một buổi

Kiểm tra bằng worktree sạch, không áp lên working tree thật:

```bash
S=<scratchpad>; P=$PWD/course/session-XX/solution
git worktree add --detach $S/wtv HEAD
for d in frontend backend infra docs; do rsync -a --delete --exclude node_modules --exclude target $d/ $S/wtv/$d/; done   # = điểm bắt đầu
cd $S/wtv
git apply $P/bai2-....patch && git apply $P/bai3-....patch      # từng lệnh một, đúng thứ tự trong solution/README.md
# (tùy chọn) ln -s <repo>/frontend/node_modules frontend/node_modules && chạy gate trên trạng thái -end
git apply -R $P/bai3-....patch && git apply -R $P/bai2-....patch   # gỡ ngược thứ tự
cd - && for d in frontend backend infra docs; do diff -rq --exclude node_modules --exclude target $d $S/wtv/$d; done   # phải rỗng
git worktree remove --force $S/wtv
```

Mỗi patch phải áp được kể cả khi chỉ đổi comment (context lỏng lẻo là lỗi hay gặp).

## Bẫy môi trường (zsh trên macOS)

- Biến không tự tách từ: `for p in $LIST` chỉ chạy một lần. Viết danh sách trực tiếp hoặc dùng từng lệnh riêng.
- Không có lệnh `timeout`. `echo =====` báo lỗi (zsh hiểu `=` là mở rộng lệnh); dùng `echo "-----"`.
- Glob không khớp là lỗi (`ls ~$*`). Dùng `find`.
- Tiến trình nền có thể giữ cổng: kiểm tra `lsof -i :4210` trước khi chạy lại.
