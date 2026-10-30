#!/usr/bin/env python3
"""Quét ngôn ngữ trong repo (chỉ báo cáo, không sửa file).

Báo hai loại vấn đề:
  1. comment tiếng Việt KHÔNG DẤU trong code/cấu hình (heuristic theo danh sách từ);
  2. thuật ngữ kỹ thuật bị dịch sang tiếng Việt (bảng trong .claude/rules/ngon-ngu-va-thuat-ngu.md).

Chạy từ gốc repo:  python3 -I .claude/skills/soat-ngon-ngu/scan.py [đường dẫn ...]
Thoát với mã 1 nếu có vấn đề (để dùng trong script), 0 nếu sạch.
"""
import os
import re
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
os.chdir(ROOT)

DEFAULT_PATHS = ['frontend/apps', 'frontend/libs', 'frontend/eslint.config.mjs', 'backend', 'infra', '.github',
                 'course', 'docs', 'handoff.md', 'README.md', 'CLAUDE.md', '.claude']
SKIP_DIRS = {'node_modules', 'target', 'dist', '.angular', '.nx', '.git', 'test-output', 'reference', 'playwright-report'}
# File cố ý giữ nguyên: migration Flyway đã áp (checksum), patch/nhánh buổi 1-5 đã push, việc dở của người dùng.
SKIP_PREFIXES = (
    'backend/src/main/resources/db/migration/V1__', 'backend/src/main/resources/db/migration/V2__',
    'backend/src/main/resources/db/migration/V3__', 'backend/src/main/resources/db/migration/V4__',
    'course/react-to-angular/', 'course/session-02/react-to-angular-guide.md',
    # Nơi định nghĩa bảng thuật ngữ (liệt kê cả cách dịch bị cấm).
    '.claude/rules/ngon-ngu-va-thuat-ngu.md', '.claude/skills/soat-ngon-ngu/',
)
SKIP_PATCH = re.compile(r'^course/session-0[1-5]/solution/.*\.patch$')
# Chữ hiển thị cho người dùng: không quét thuật ngữ.
UI_FILES = re.compile(r'(i18n/(vi|en)\.json|messages(_en)?\.properties)$')
CODE_EXT = ('.ts', '.mts', '.js', '.mjs', '.java', '.scss', '.css', '.html', '.yml', '.yaml', '.sql', '.sh', '.xml', '.properties')
PROSE_EXT = ('.md', '.html', '.patch')

DIACRITICS = re.compile('[àáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]', re.I)
# Từ tiếng Việt không dấu hay gặp (chọn từ ít trùng tiếng Anh).
VI_WORDS = set('''khong nguoi dung cua cho trong mot cac neu khi duoc phai voi vao lai ve se nay ban chi tren duoi theo nhu hoac
dang goi kiem tra luu gan doi bao loi phieu thue dich tieng ngon mac dinh toi khach hang phien nhan vien quyen tim hien xoa
sua lam viec nghiep vu yeu cau muc dich nhung cung sau truoc sang thoi gian ngay gio nhieu moi het xong chay dong nho
ben ngoai noi tuong nhanh cham chung lay gui trang man hinh nut thong hien thi thanh tro lien ket qua quay cap nhat xu ly
ngan buoi chuan giang vien hoc phat hanh luong goc tai tao lap sinh dieu khien truy van tuy chon'''.split())

# (regex, gợi ý). Chỉ các thuật ngữ đã chốt; "phiên", "vai trò", "luồng" chưa quyết nên không báo.
TERMS = [
    (r'bí mật', 'secret / secretKey'), (r'chữ ký', 'signature'), (r'[Tt]hu hồi', 'revoke'), (r'[Xx]oay vòng', 'rotation'),
    (r'lệch đồng hồ', 'clock skew'), (r'hủy đăng ký', 'unsubscribe'), (r'họ token', 'token family'), (r'cả họ', 'cả family'),
    (r'khóa dòng', 'lock dòng'), (r'đồng hồ giả', 'fake timers'), (r'khóa ký', 'signing key'), (r'tài nguyên', 'resource'),
]
MIN_WORDS = 1  # comment ngắn (vd '/* Bài tập */') cũng bị bắt; tăng lên 2 nếu nhiều báo nhầm
MARK = re.compile(r'//|/\*|<!--|^\s*\*|^\s*#|\s--\s|^\s*--')


def comment_part(line):
    # Bỏ qua dấu comment nằm trong chuỗi (số dấu nháy đứng trước là lẻ), vd '/* ...' trong tên test.
    for m in MARK.finditer(line):
        before = line[:m.start()]
        if all(before.count(q) % 2 == 0 for q in ("'", '"', '`')):
            return line[m.start():]
    return None


def iter_files(paths):
    for p in paths:
        if os.path.isfile(p):
            yield p
            continue
        for dp, dn, fn in os.walk(p):
            dn[:] = [d for d in dn if d not in SKIP_DIRS]
            for f in fn:
                yield os.path.join(dp, f)


def main():
    paths = [p for p in (sys.argv[1:] or DEFAULT_PATHS) if os.path.exists(p)]
    issues = []
    for path in iter_files(paths):
        rel = os.path.relpath(path, ROOT).replace(os.sep, '/')
        if rel.startswith(SKIP_PREFIXES) or SKIP_PATCH.match(rel) or UI_FILES.search(rel):
            continue
        is_code = rel.endswith(CODE_EXT)
        is_prose = rel.endswith(PROSE_EXT)
        if not (is_code or is_prose):
            continue
        try:
            lines = open(path, encoding='utf-8').read().split('\n')
        except (UnicodeDecodeError, OSError):
            continue
        for i, line in enumerate(lines, 1):
            body = line[1:] if rel.endswith('.patch') and line[:1] in '+- ' else line
            cm = comment_part(body) if is_code or rel.endswith('.patch') else None
            if cm and not DIACRITICS.search(cm):
                words = re.findall(r'[a-z]+', cm.lower())
                if sum(w in VI_WORDS for w in words) >= MIN_WORDS:
                    issues.append((rel, i, 'comment không dấu', cm.strip()[:100]))
            scope = body if (is_prose and not rel.endswith('.patch')) or rel.endswith('.patch') else cm
            if scope:
                for pat, hint in TERMS:
                    if re.search(pat, scope):
                        issues.append((rel, i, f'thuật ngữ -> {hint}', scope.strip()[:100]))
                        break
    for rel, i, kind, text in issues:
        print(f'{rel}:{i}: [{kind}] {text}')
    print(f'\n{len(issues)} vấn đề')
    return 1 if issues else 0


if __name__ == '__main__':
    sys.exit(main())
