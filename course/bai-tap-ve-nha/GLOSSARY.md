# Kiến trúc Angular + Nx — Glossary

Từ vựng chuẩn cho các bài học về tổ chức dự án Angular lớn bằng Nx, dùng thống nhất trong mọi bài.

## Workspace

**Workspace**:
Một repo Nx chứa nhiều project, có chung `nx.json`, `package.json` và phiên bản thư viện.
_Avoid_: monorepo (dùng khi nói về khái niệm chung, không dùng cho repo này), solution

**Project**:
Một đơn vị Nx có `project.json` riêng: một app hoặc một lib.
_Avoid_: module, package

**App**:
Project chạy được (vd `portal`, `admin`), chỉ ghép các lib lại bằng routing và provider.
_Avoid_: ứng dụng con, shell app

**Lib**:
Project không tự chạy, chứa code dùng chung và chỉ lộ ra ngoài qua `src/index.ts`.
_Avoid_: thư viện con, module, package

## Loại lib (type)

**Feature lib**:
Lib chứa màn hình và route của một nghiệp vụ, được phép gọi data-access (vd `portal-feature-subscribers`).
_Avoid_: page lib, smart lib

**UI lib**:
Lib chứa component trình bày, chỉ nhận dữ liệu qua `input()` và báo ra qua `output()`, không gọi API (vd `shared-ui-layout`).
_Avoid_: component lib, dumb lib

**Data-access lib**:
Lib chứa service gọi API, model và state phía client (vd `shared-data-access-api`).
_Avoid_: service lib, api lib

**Util lib**:
Lib chứa hàm thuần, type, hằng số; không gọi API, không có màn hình (vd `shared-util-config`).
_Avoid_: helper lib, common, shared (từ "shared" dành cho scope)

## Luật phụ thuộc

**Tag**:
Nhãn gắn trong `project.json` để phân loại project, dạng `chiều:giá-trị`.
_Avoid_: label

**Scope**:
Chiều tag cho biết project thuộc app/miền nghiệp vụ nào: `scope:portal`, `scope:admin`, `scope:shared`.
_Avoid_: domain (khi nói về tag)

**Type**:
Chiều tag cho biết vai trò kiến trúc của project: `type:app`, `type:feature`, `type:ui`, `type:data-access`, `type:util`.
_Avoid_: layer, kind

**Module boundaries**:
Tập luật "project có tag X chỉ được phụ thuộc project có tag Y", do rule ESLint `@nx/enforce-module-boundaries` kiểm tra mỗi lần lint.
_Avoid_: dependency rules (khi nói tên rule), import rules

**Public API**:
Những gì lib export trong `src/index.ts`; project khác chỉ được import lib qua đường dẫn `@care/<tên-lib>`, không đi vòng bằng đường dẫn tương đối vào file bên trong.
_Avoid_: barrel (tên kỹ thuật của file, không phải khái niệm), entry point
