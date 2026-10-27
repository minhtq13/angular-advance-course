import { InjectionToken, Provider } from '@angular/core';

/**
 * local: backend tu phat JWT, dang nhap bang form trong app (mac dinh).
 * oidc: dang nhap qua Keycloak (SSO) - buoi 5.
 */
export type AuthConfig =
  { mode: 'local' } | { mode: 'oidc'; issuer: string; clientId: string };

/** Cau hinh runtime, doc tu /config.json luc khoi dong -> 1 ban build chay duoc moi moi truong (buoi 7). */
export interface AppConfig {
  apiUrl: string;
  auth: AuthConfig;
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
