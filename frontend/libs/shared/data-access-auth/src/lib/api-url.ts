/**
 * Đường dẫn của url bên trong API (vd "/api/tickets"), hoặc null nếu url không thuộc API của mình.
 * So sánh origin (scheme + host + port) và thư mục gốc của API, KHÔNG so chuỗi đầu:
 * "http://api".startsWith nhầm cả "http://api.evil.com", "http://api@evil.com" (host là evil.com), "http://apix".
 * apiUrl rỗng = API cùng origin với app (sau reverse proxy): tính theo base của trang.
 */
export function apiPathOf(
  url: string,
  apiUrl: string,
  base: string,
): string | null {
  let target: URL;
  let api: URL;
  try {
    target = new URL(url, base);
    api = new URL(apiUrl || '/', base);
  } catch {
    return null;
  }
  const root = api.pathname.replace(/\/$/, '');
  if (
    target.origin !== api.origin ||
    (target.pathname !== root && !target.pathname.startsWith(`${root}/`))
  ) {
    return null;
  }
  return target.pathname.slice(root.length) || '/';
}
