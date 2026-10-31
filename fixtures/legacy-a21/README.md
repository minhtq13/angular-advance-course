# Fixture buổi 10: Care Portal "bản cũ" trên Angular 21

App nhỏ (màn hình phiếu yêu cầu, dữ liệu từ `public/tickets.json`, không cần backend) viết **theo kiểu cũ có chủ đích** để luyện nâng cấp lên Angular 22:
`NgModule`, `*ngIf`/`*ngFor`, `@Input`/`@Output`, constructor DI, `BehaviorSubject`, `HttpClientModule`, `HttpClientTestingModule`, zone.js,
và hai thư viện bên thứ ba: `ngx-toastr` (thông báo) và `ngx-pipes` (pipe `shorten`).

Dự án npm **độc lập** với `frontend/` (lockfile riêng, `node_modules` riêng), Node theo `.nvmrc`.

```bash
cd fixtures/legacy-a21
nvm use && npm ci
npx ng test --watch=false     # 7 test
npx ng build
npx ng serve --port 4400      # http://localhost:4400/tickets
```

Đề lab: `course/session-10/lab/README.md`. Đáp án đã nâng xong (standalone, control flow, signal, Angular 22, zoneless): nhánh `session10-end`.
