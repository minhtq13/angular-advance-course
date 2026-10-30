---
name: commit-theo-buoi
description: Tạo nhánh sessionXX-start / sessionXX-end và commit main cho một buổi đã soạn xong, rồi push. CHỈ chạy khi người dùng bảo rõ "commit" hoặc "push" buổi đó.
argument-hint: "<số buổi, vd 06>"
disable-model-invocation: true
---

# Commit buổi $ARGUMENTS theo git flow

**Điều kiện:** người dùng đã duyệt diff và nói rõ commit/push. Sự đồng ý lần trước không áp dụng. Không force-push, không tag.
Trước khi bắt đầu, tóm tắt cho người dùng sẽ tạo gì và đẩy gì, và chờ xác nhận nếu chưa rõ.

Quy ước: `sessionXX-start` = `session(XX-1)-end` + một commit chuẩn bị (chỉ `frontend/ backend/ infra/ docs/`); `sessionXX-end` = start + đáp án;
`main` = tài liệu mới nhất + code ở điểm bắt đầu của buổi mới nhất. Dựng nhánh từ **cây (tree)** đã kiểm tra để tác giả đúng và không kéo theo commit tạm.

## 0. Kiểm tra

```bash
git status --short                      # xác định file người dùng đang sửa dở: sẽ LOẠI khỏi commit main
git branch -a | grep session            # session(XX-1)-end phải tồn tại
```

Chạy lại gate và chuỗi patch (skill `kiem-tra-gate`) và `soat-ngon-ngu`. Nếu working tree đã đổi sau commit tạm cũ thì **dựng lại từ working tree hiện tại**,
đừng dùng commit tạm trong worktree.

## 1. `sessionXX-start` từ working tree hiện tại

```bash
PREV=$(git rev-parse session<NN-1>-end)
export GIT_INDEX_FILE=$(mktemp -u)               # index tạm, không đụng index thật
git read-tree $PREV
git add -A -- frontend backend infra docs        # working tree = điểm bắt đầu
TREE=$(git write-tree)
START=$(git commit-tree $TREE -p $PREV -m "Chuẩn bị điểm bắt đầu buổi XX (sessionXX-start)

<tóm tắt 2-3 dòng: backend/frontend đã chuẩn bị, lỗi cố ý>

<dòng Co-Authored-By theo hướng dẫn của hệ thống>")
unset GIT_INDEX_FILE
git update-ref refs/heads/sessionXX-start $START
```

Lưu ý buổi 6: `session06-start` so với `session05-end` đổi khoảng 107 file, vì ngoài phần chuẩn bị còn có đợt chuyển comment trong code sang tiếng Việt có dấu
và thuật ngữ tiếng Anh (2026-10-30). Ghi rõ điều đó trong message để học viên đọc `git diff` không bị bất ngờ. Kiểm tra trước khi tạo ref:
`git diff-tree -r --stat $PREV $TREE | tail -1`.

## 2. `sessionXX-end` bằng cách áp patch lên start

```bash
git worktree add --detach <scratchpad>/wtend sessionXX-start
cd <scratchpad>/wtend
git apply <repo>/course/session-XX/solution/bai2-....patch      # từng patch, đúng thứ tự trong solution/README.md
git apply <repo>/course/session-XX/solution/bai3-....patch
git add -A && TREE=$(git write-tree)
END=$(git commit-tree $TREE -p $(git rev-parse sessionXX-start) -m "Áp đáp án buổi XX (sessionXX-end)

<dòng Co-Authored-By>")
cd <repo> && git update-ref refs/heads/sessionXX-end $END
```

Kiểm tra: `git diff sessionXX-start sessionXX-end --stat` đúng bằng tập file của các patch; áp đủ rồi gỡ ngược ra đúng `sessionXX-start`.

## 3. Commit `main`

```bash
git add -A -- . ':!<đường dẫn người dùng đang sửa dở>' ':!<...>'    # vd ':!course/session-01/slides' ':!course/react-to-angular'
git diff --cached --stat                                           # soát lại, đặc biệt không có file tạm (config.json đổi apiUrl, zz-*.spec.ts)
git diff sessionXX-start --stat -- frontend backend infra docs     # phải rỗng: code trên main = sessionXX-start
git commit -m "Soạn buổi XX: <tên buổi>

<tóm tắt>

<dòng Co-Authored-By>"
```

## 4. Push và dọn

```bash
git push origin main sessionXX-start sessionXX-end
git worktree remove --force <scratchpad>/wtend     # và worktree làm việc wtN nếu còn
git worktree prune
```

Báo người dùng: hash từng nhánh, danh sách commit, những gì cố ý không đưa vào (file của họ). Cập nhật `handoff.md` (nhánh, hash) trong một commit riêng **chỉ khi được bảo**.
Nếu một bước lỗi giữa chừng: dừng, nêu trạng thái hiện tại (nhánh nào đã tạo, đã push chưa), không tự dọn bằng lệnh xóa.
