---
name: soan-buoi-hoc
description: Quy trình soạn một buổi của khóa Angular nâng cao từ khung đến slide, lab, đáp án (patch), ghi chú giảng viên và bài tập về nhà. Dùng khi người dùng bảo soạn buổi N.
argument-hint: "<số buổi, vd 07>"
---

# Soạn buổi $ARGUMENTS

Đọc trước: `handoff.md` (trạng thái, việc còn dở của buổi), `course/session-$ARGUMENTS/README.md` (khung theo đề cương), rule `tai-lieu-khoa-hoc`.
**Không commit.** Làm xong để thay đổi chưa commit, báo người dùng, chờ lệnh (skill `commit-theo-buoi`).

## 1. Thiết kế use case

- Đề cương là chuẩn (nội dung chính, use case/lab, sản phẩm đầu ra). Giữ tên Care Portal, ánh xạ Service Portal trong `CLAUDE.md`.
- Thiết kế một **lỗi thật, tái hiện được** trên Care Portal (không bịa). Lab 5 bài, tổng 120 phút; mỗi bài có tiêu chí kiểm tra rõ.
- Liệt kê "cần chuẩn bị" ở README buổi: phần nào phải làm sẵn ở `-start` (backend, i18n vi/en, route, test cơ bản), phần nào là đáp án.

## 2. Dựng chỗ làm việc

```bash
S=<scratchpad>
git worktree add --detach $S/wtN session<NN-1>-end       # điểm xuất phát = đáp án buổi trước
ln -s <repo>/frontend/node_modules $S/wtN/frontend/node_modules
```

Làm trong worktree, commit tạm (`git -c user.name=tmp -c user.email=tmp@local commit`) sau mỗi bước; commit tạm không lên origin.

## 3. Phần chuẩn bị `-start`

Thêm đúng những gì học viên cần để bắt đầu: backend (biến môi trường demo, endpoint, migration mới cho DB thật), frontend có lỗi cố ý, test cơ bản, key i18n **vi và en**.
Chạy gate (skill `kiem-tra-gate`) rồi commit tạm. **Tái hiện lỗi trên trình duyệt thật** (mục C của skill) và ghi lại số đo/log thật vào tài liệu.

## 4. Đáp án từng bài

Với mỗi bài: viết **test đỏ trước** trên code chưa sửa (ghi lại thông báo lỗi đỏ), sửa cho xanh, chạy gate, rồi:

```bash
git add -A -- . ':!<file tạm: config.json, zz-*.spec.ts>'
git diff --cached > $S/bai-N-<ten>.patch && git commit -qm "tmp: bai N"
```

Với mỗi cách sửa dễ sai, **thử phá** (bỏ một dòng, đổi toán tử) và ghi test nào đỏ, vì sao: đưa vào bảng "thử phá" của `solution/README.md`.
Kiểm tra lại trên trình duyệt với đáp án đã áp.

## 5. Đưa vào `main`

1. Áp phần chuẩn bị lên working tree `main`: `git diff --binary main <commit chuẩn bị> -- frontend backend infra docs > main-to-start.patch && git apply`
   (đã gồm đáp án buổi trước). Chép patch đáp án vào `course/session-$ARGUMENTS/solution/`.
2. Kiểm tra: working tree = điểm bắt đầu (`git diff <commit chuẩn bị> -- frontend backend infra docs` rỗng); chuỗi patch áp và gỡ khớp (mục D của `kiem-tra-gate`).
   Sau `git add -N`, nhớ `git reset -q -- frontend backend infra docs` để index sạch.
3. Không đụng file người dùng đang sửa dở (`git status`).

## 6. Tài liệu

`slides/slides.md` (Marp, rồi `xuat-slide`), `lab/README.md`, `solution/README.md`, `instructor-notes.md` (timeline khớp **số slide**, kịch bản demo có lệnh sẵn,
câu hỏi hay gặp, lỗi thường gặp), `note-cho-giang-vien.md`, README buổi, bài tập về nhà (skill `bai-tap-ve-nha`).
Cập nhật bảng trong `course/README.md`, `course/bai-tap-ve-nha/README.md`, và `handoff.md` (mục 3, 4, lệnh demo).
Số liệu, output lỗi, thời gian: lấy từ lần chạy thật. Hạ tầng demo mới (biến môi trường, cổng) ghi vào `infra/docker-compose.yml` và `instructor-notes.md`.

## 7. Kết thúc

1. `python3 -I .claude/skills/soat-ngon-ngu/scan.py` phải sạch (hoặc chỉ còn báo nhầm đã giải thích).
2. Gate đầy đủ trên trạng thái `-end` (áp đủ patch ở worktree sạch) và trên `-start`.
3. Dọn: dừng tiến trình nền, `docker rm` container tạm, khôi phục file tạm. Giữ worktree chứa commit tạm đến khi người dùng cho commit.
4. Báo: use case + số đo thật, danh sách file, những gì đã/chưa kiểm tra, rủi ro còn lại, dự kiến nhánh/commit sẽ tạo. Hỏi duyệt rồi dừng.
