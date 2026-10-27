import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { APP_CONFIG } from '@care/shared-util-config';
import { map, Observable, tap } from 'rxjs';
import { decodeJwtPayload, isExpired } from './jwt';

export type AppRole = 'AGENT' | 'SUPERVISOR' | 'ADMIN';

/** Key dich ten vai tro (khong hien ma ky thuat AGENT/SUPERVISOR cho nguoi dung). */
export const ROLE_LABEL_KEYS: Record<AppRole, string> = {
  AGENT: 'roles.AGENT',
  SUPERVISOR: 'roles.SUPERVISOR',
  ADMIN: 'roles.ADMIN',
};

export interface AuthUser {
  username: string;
  displayName: string;
  roles: AppRole[];
}

/** Claim trong access token do backend phat (xem TokenService.issue). */
export interface AccessTokenClaims {
  preferred_username?: string;
  name?: string;
  roles?: string[];
}

export function userFromClaims(claims: AccessTokenClaims): AuthUser {
  const username = claims.preferred_username ?? '';
  const roles = (claims.roles ?? []).filter((role): role is AppRole =>
    Object.hasOwn(ROLE_LABEL_KEYS, role),
  );
  return { username, displayName: claims.name ?? username, roles };
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

const STORAGE_KEY = 'care.auth';

/**
 * Dang nhap bang JWT do backend phat: POST /api/auth/login -> access + refresh token.
 * Token luu trong sessionStorage (mat khi dong tab). Buoi 5 se ban ve noi luu token va lam refresh token.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = inject(APP_CONFIG).apiUrl;

  private tokens: TokenResponse | null = null;
  private readonly user = signal<AuthUser | null>(null);

  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly username = computed(() => this.user()?.username ?? '');
  readonly displayName = computed(() => this.user()?.displayName ?? '');
  readonly roles = computed(() => this.user()?.roles ?? []);
  readonly roleLabelKeys = computed(() =>
    this.roles().map((role) => ROLE_LABEL_KEYS[role]),
  );

  hasAnyRole(...roles: AppRole[]): boolean {
    return roles.some((role) => this.roles().includes(role));
  }

  /** Chay trong provideAppInitializer, truoc khi app render: khoi phuc phien tu sessionStorage. */
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

  /** Dua nguoi dung toi trang dang nhap; sau khi xong quay lai returnUrl. */
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
