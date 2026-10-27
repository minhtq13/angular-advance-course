import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
  Provider,
} from '@angular/core';
import { AuthConfig } from '@care/shared-util-config';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { AuthService } from './auth.service';
import { LocalAuthService } from './local-auth.service';
import { OidcAuthService } from './oidc-auth.service';

/** Chon cach dang nhap theo config.json: doi che do khong can sua code hay build lai. */
export function provideAuth(config: AuthConfig): EnvironmentProviders {
  const strategy: (Provider | EnvironmentProviders)[] =
    config.mode === 'oidc'
      ? [
          provideOAuthClient(),
          { provide: AuthService, useClass: OidcAuthService },
        ]
      : [{ provide: AuthService, useExisting: LocalAuthService }];

  return makeEnvironmentProviders([
    ...strategy,
    provideAppInitializer(() => inject(AuthService).init()),
  ]);
}
