import { InjectionToken, Provider } from '@angular/core';

/** Cấu hình runtime, đọc từ /config.json lúc khởi động -> 1 bản build chạy được mọi môi trường (buổi 9). */
export interface AppConfig {
  /** Tên môi trường hiện trên header, vd "DEV", "TEST". Bỏ trống ở production. */
  environmentName?: string;
  apiUrl: string;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');

export async function loadAppConfig(url = '/config.json'): Promise<AppConfig> {
  const response = await fetch(url, { cache: 'no-cache' });
  if (!response.ok) {
    throw new Error(`Khong tai duoc ${url}: ${response.status}`);
  }
  return response.json();
}

export function provideAppConfig(config: AppConfig): Provider {
  return { provide: APP_CONFIG, useValue: config };
}
