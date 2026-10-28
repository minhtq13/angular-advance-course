import { InjectionToken, Provider } from '@angular/core';

/** Cau hinh runtime, doc tu /config.json luc khoi dong -> 1 ban build chay duoc moi moi truong (buoi 9). */
export interface AppConfig {
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
