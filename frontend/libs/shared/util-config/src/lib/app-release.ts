import { ErrorHandler, Provider } from '@angular/core';

/**
 * Bản phát hành đang chạy (buổi 9). Ghi vào image lúc build (version.json), KHÁC config.json:
 * config theo môi trường (mount lúc chạy), version theo artifact (không đổi khi chuyển môi trường).
 */
export interface AppRelease {
  version: string;
  commit: string;
}

const DEV_RELEASE: AppRelease = { version: 'dev', commit: 'local' };

export async function loadAppRelease(
  url = '/version.json',
): Promise<AppRelease> {
  try {
    const response = await fetch(url, { cache: 'no-cache' });
    // Dev server không có version.json: trả 404 hoặc index.html (SPA fallback) -> không phải lỗi.
    return response.ok ? await response.json() : DEV_RELEASE;
  } catch {
    return DEV_RELEASE;
  }
}

/** Ghi lỗi chưa bắt kèm version + commit: log/kênh quan sát lọc được lỗi theo bản phát hành. */
class ReleaseErrorHandler extends ErrorHandler {
  constructor(private readonly release: AppRelease) {
    super();
  }

  override handleError(error: unknown): void {
    console.error(
      `[care-portal ${this.release.version} ${this.release.commit}]`,
      error,
    );
  }
}

export function provideAppRelease(release: AppRelease): Provider {
  return { provide: ErrorHandler, useValue: new ReleaseErrorHandler(release) };
}
