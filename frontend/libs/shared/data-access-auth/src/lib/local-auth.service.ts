import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { APP_CONFIG } from '@care/shared-util-config';
import { map, Observable, tap } from 'rxjs';
import { AccessTokenClaims, AuthService, userFromClaims } from './auth.service';
import { decodeJwtPayload, isExpired } from './jwt';

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

const STORAGE_KEY = 'care.auth';

/**
 * Che do local: POST /api/auth/login -> backend tra ve access + refresh token (JWT).
 * Token luu trong sessionStorage (mat khi dong tab). Buoi 5 se ban ve noi luu token va lam refresh token.
 */
@Injectable({ providedIn: 'root' })
export class LocalAuthService extends AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = inject(APP_CONFIG).apiUrl;

  private tokens: TokenResponse | null = null;

  async init(): Promise<void> {
    const saved = readStorage();
    if (saved && !isExpired(saved.accessToken)) {
      this.setTokens(saved);
    } else {
      this.clear();
    }
  }

  loginWithPassword(username: string, password: string): Observable<void> {
    return this.http
      .post<TokenResponse>(`${this.apiUrl}/api/auth/login`, {
        username,
        password,
      })
      .pipe(
        tap((tokens) => this.setTokens(tokens)),
        map(() => undefined),
      );
  }

  accessToken(): string | null {
    return this.tokens && !isExpired(this.tokens.accessToken)
      ? this.tokens.accessToken
      : null;
  }

  login(returnUrl = this.router.url): void {
    this.clear();
    const queryParams =
      returnUrl && !returnUrl.startsWith('/login') ? { returnUrl } : {};
    this.router.navigate(['/login'], { queryParams });
  }

  logout(): void {
    this.clear();
    this.router.navigate(['/login']);
  }

  private setTokens(tokens: TokenResponse): void {
    this.tokens = tokens;
    writeStorage(tokens);
    this.user.set(
      userFromClaims(decodeJwtPayload<AccessTokenClaims>(tokens.accessToken)),
    );
  }

  private clear(): void {
    this.tokens = null;
    writeStorage(null);
    this.user.set(null);
  }
}

// sessionStorage co the bi chan (che do rieng tu, chinh sach trinh duyet) -> khong de app vo vi no.
function readStorage(): TokenResponse | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TokenResponse) : null;
  } catch {
    return null;
  }
}

function writeStorage(tokens: TokenResponse | null): void {
  try {
    if (tokens) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // bo qua
  }
}
