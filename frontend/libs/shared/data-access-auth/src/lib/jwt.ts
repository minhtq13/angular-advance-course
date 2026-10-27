/** Giai ma phan payload cua JWT (KHONG kiem tra chu ky - viec do la cua backend). */
export function decodeJwtPayload<T>(token: string): T {
  const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const json = new TextDecoder().decode(
    Uint8Array.from(atob(payload), (c) => c.charCodeAt(0)),
  );
  return JSON.parse(json) as T;
}

export function isExpired(token: string, skewSeconds = 10): boolean {
  const { exp } = decodeJwtPayload<{ exp?: number }>(token);
  return !exp || exp * 1000 <= Date.now() + skewSeconds * 1000;
}
