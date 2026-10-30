import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { AuthConfig } from '@care/shared-util-config';
import {
  LogLevel,
  provideAuth as provideOidcClient,
} from 'angular-auth-oidc-client';
import { AuthService } from './auth.service';
import { LocalAuthService } from './local-auth.service';
import { OIDC_CALLBACK_PATH, OidcAuthService } from './oidc-auth.service';

/** Composition root của xác thực: chọn adapter cho port AuthService theo config.json (mặc định local). */
export function provideAuth(
  config: AuthConfig = { mode: 'local' },
): EnvironmentProviders {
  if (config.mode === 'oidc') {
    const origin = location.origin;
    return makeEnvironmentProviders([
      provideOidcClient({
        config: {
          authority: config.authority,
          clientId: config.clientId,
          redirectUrl: origin + OIDC_CALLBACK_PATH,
          postLogoutRedirectUri: origin + '/login',
          scope: 'openid profile email',
          responseType: 'code',
          // Gia hạn bằng refresh token trước khi access token hết hạn (không dùng iframe ẩn).
          silentRenew: true,
          useRefreshToken: true,
          renewTimeBeforeTokenExpiresInSeconds: 30,
          ignoreNonceAfterRefresh: true,
          // Không để thư viện tự điều hướng tới postLoginRoute ("/") sau callback:
          // OidcAuthService.init() đưa người dùng về đúng trang định vào (returnUrl).
          triggerAuthorizationResultEvent: true,
          logLevel: LogLevel.Warn,
        },
      }),
      { provide: AuthService, useExisting: OidcAuthService },
      provideAppInitializer(() => inject(AuthService).init()),
    ]);
  }
  return makeEnvironmentProviders([
    { provide: AuthService, useExisting: LocalAuthService },
    provideAppInitializer(() => inject(AuthService).init()),
  ]);
}
