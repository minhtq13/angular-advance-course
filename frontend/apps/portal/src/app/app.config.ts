import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { authInterceptor, provideAuth } from '@care/shared-data-access-auth';
import { provideUi } from '@care/shared-ui-layout';
import {
  AppConfig,
  AppRelease,
  provideAppConfig,
  provideAppRelease,
} from '@care/shared-util-config';
import { acceptLanguageInterceptor, provideI18n } from '@care/shared-util-i18n';
import { appRoutes } from './app.routes';

export function appConfig(
  config: AppConfig,
  release: AppRelease,
): ApplicationConfig {
  return {
    providers: [
      provideBrowserGlobalErrorListeners(),
      provideAppConfig(config),
      // Buổi 9: lỗi chưa bắt ghi kèm version (version.json trong image) -> lọc lỗi theo bản phát hành.
      provideAppRelease(release),
      provideHttpClient(
        withInterceptors([acceptLanguageInterceptor, authInterceptor]),
      ),
      provideRouter(appRoutes, withComponentInputBinding()),
      provideAuth(config.auth),
      provideI18n(),
      provideUi(),
    ],
  };
}
