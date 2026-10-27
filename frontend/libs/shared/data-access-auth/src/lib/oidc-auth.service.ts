import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { APP_CONFIG } from '@care/shared-util-config';
import { OAuthService } from 'angular-oauth2-oidc';
import { filter } from 'rxjs';
import { AccessTokenClaims, AuthService, userFromClaims } from './auth.service';
import { decodeJwtPayload } from './jwt';

/** Che do oidc (buoi 5): dang nhap qua Keycloak bang Authorization Code + PKCE, SSO giua portal va admin. */
@Injectable()
export class OidcAuthService extends AuthService {
  private readonly oauth = inject(OAuthService);
  private readonly router = inject(Router);
  private readonly config = inject(APP_CONFIG).auth;

  async init(): Promise<void> {
    if (this.config.mode !== 'oidc') {
      throw new Error(
        'OidcAuthService can auth.mode = "oidc" trong config.json',
      );
    }
    this.oauth.configure({
      issuer: this.config.issuer,
      clientId: this.config.clientId,
      redirectUri: window.location.origin + '/',
      postLogoutRedirectUri: window.location.origin + '/',
      responseType: 'code',
      scope: 'openid profile email',
      requireHttps: false,
    });

    this.oauth.events
      .pipe(
        filter(
          (e) => e.type === 'token_received' || e.type === 'token_refreshed',
        ),
      )
      .subscribe(() => this.syncUser());

    // state = duong dan dang mo, de quay lai dung trang sau khi Keycloak redirect ve.
    const loggedIn = await this.oauth.loadDiscoveryDocumentAndLogin({
      state: location.pathname + location.search,
    });
    if (!loggedIn) {
      // Dang chuyen huong sang Keycloak: giu app o trang thai cho,
      // khong render va khong goi API khi chua co token.
      return new Promise<void>(() => undefined);
    }
    this.oauth.setupAutomaticSilentRefresh();
    this.syncUser();

    const returnUrl = this.oauth.state
      ? decodeURIComponent(this.oauth.state)
      : null;
    if (returnUrl && returnUrl !== '/') {
      // Chay sau khi router khoi tao xong navigation dau tien.
      setTimeout(() => this.router.navigateByUrl(returnUrl));
    }
  }

  accessToken(): string | null {
    return this.oauth.hasValidAccessToken()
      ? this.oauth.getAccessToken()
      : null;
  }

  login(returnUrl = location.pathname + location.search): void {
    this.oauth.initCodeFlow(returnUrl);
  }

  logout(): void {
    this.oauth.logOut();
  }

  private syncUser(): void {
    const token = this.accessToken();
    this.user.set(
      token ? userFromClaims(decodeJwtPayload<AccessTokenClaims>(token)) : null,
    );
  }
}
