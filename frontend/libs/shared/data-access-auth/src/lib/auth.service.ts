import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { APP_CONFIG } from '@care/shared-util-config';
import { map, Observable, tap } from 'rxjs';
import { decodeJwtPayload, isExpired } from './jwt';

export type AppRole = 'AGENT' | 'SUPERVISOR' | 'ADMIN';

/** Key dịch tên vai trò (không hiện mã kỹ thuật AGENT/SUPERVISOR cho người dùng). */
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

/** Claim trong access token do backend phát (xem TokenService.issue). */
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
 * Đăng nhập bằng JWT do backend phát: POST /api/auth/login -> access token (ngắn hạn) + refresh token.
 * Refresh token rotation: mỗi token chỉ đổi được MỘT lần, gửi lại token đã dùng -> server revoke cả phiên.
 * Token lưu trong sessionStorage (mất khi đóng tab). Buổi 6 bàn về nơi lưu token.
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

  /**
   * Chạy trong provideAppInitializer, trước khi app render: khôi phục phiên từ sessionStorage.
   * Access token hết hạn không sao (sẽ refresh); refresh token hết hạn thì phiên đã kết thúc.
   */
  async init(): Promise<void> {
    const saved = readStorage();
    if (saved && !isExpired(saved.refreshToken)) {
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

  /** Gửi nguyên token, kể cả khi đã hết hạn: server mới quyết định, hết hạn thì trả 401 và interceptor refresh. */
  accessToken(): string | null {
    return this.tokens?.accessToken ?? null;
  }

  /** Đổi refresh token lấy cặp token mới; trả về access token mới. */
  refresh(): Observable<string> {
    return this.http
      .post<TokenResponse>(`${this.apiUrl}/api/auth/refresh`, {
        refreshToken: this.tokens?.refreshToken,
      })
      .pipe(
        tap((tokens) => this.setTokens(tokens)),
        map((tokens) => tokens.accessToken),
      );
  }

  /** Đưa người dùng tới trang đăng nhập; sau khi xong quay lại returnUrl. */
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

// sessionStorage có thể bị chặn (chế độ riêng tư, chính sách trình duyệt) -> không để app vỡ vì nó.
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
    // bỏ qua
  }
}
