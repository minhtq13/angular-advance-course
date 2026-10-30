import { InjectionToken, Provider } from '@angular/core';

/** Cấu hình runtime, đọc từ /config.json lúc khởi động -> 1 bản build chạy được mọi môi trường (buổi 9). */
export interface AppConfig {
  /** Tên môi trường hiện trên header, vd "DEV", "TEST". Bỏ trống ở production. */
  environmentName?: string;
  apiUrl: string;
  /** Cách đăng nhập. Bỏ trống = local (JWT do backend phát). Buổi 7: "oidc" qua Keycloak. */
  auth?: AuthConfig;
}

export type AuthConfig =
  | { mode: 'local' }
  | {
      mode: 'oidc';
      /** URL realm, cũng là "iss" của token, vd http://localhost:8180/realms/care */
      authority: string;
      /** Client public (không có secret), bật PKCE */
      clientId: string;
    };

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
