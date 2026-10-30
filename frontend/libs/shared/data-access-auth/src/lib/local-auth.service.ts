import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { APP_CONFIG } from '@care/shared-util-config';
import { finalize, map, Observable, share, tap } from 'rxjs';
import { AuthService, UserClaims, userFromClaims } from './auth.service';
import { decodeJwtPayload, isExpired } from './jwt';

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
export class LocalAuthService extends AuthService {
  readonly mode = 'local';

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = inject(APP_CONFIG).apiUrl;

  private tokens: TokenResponse | null = null;

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

  /** Chế độ local không có máy chủ định danh: trang đăng nhập hiện form. */
  loginWithSso(): void {
    throw new Error('LocalAuthService: dang nhap bang form, khong co SSO');
  }

  /** Gửi nguyên token, kể cả khi đã hết hạn: server mới quyết định, hết hạn thì trả 401 và interceptor refresh. */
  accessToken(): string | null {
    return this.tokens?.accessToken ?? null;
  }

  /** Lần refresh đang chạy (nếu có): mọi request 401 trong lúc này dùng chung nó. */
  private refreshing: Observable<string> | null = null;

  /**
   * Đổi refresh token lấy cặp token mới; trả về access token mới.
   * Dùng chung một request cho mọi người gọi đồng thời: refresh token rotation chỉ dùng được MỘT lần,
   * gửi 2 lần cùng token -> server coi là reuse và revoke cả phiên.
   */
  refresh(): Observable<string> {
    this.refreshing ??= this.http
      .post<TokenResponse>(`${this.apiUrl}/api/auth/refresh`, {
        refreshToken: this.tokens?.refreshToken,
      })
      .pipe(
        tap({
          next: (tokens) => this.setTokens(tokens),
          // Đăng xuất ở đây (phần dùng chung) -> chỉ MỘT lần dù bao nhiêu request đang chờ.
          // Chỉ khi server từ chối (401: hết hạn, bị revoke, reuse); mất mạng thì giữ phiên, thử lại sau.
          error: (error: unknown) => {
            if (error instanceof HttpErrorResponse && error.status === 401) {
              this.login(this.router.url, 'expired');
            }
          },
        }),
        map((tokens) => tokens.accessToken),
        // Xong (thành công hay lỗi) -> lần hết hạn sau phải refresh mới, không phát lại kết quả cũ.
        finalize(() => (this.refreshing = null)),
        share(),
      );
    return this.refreshing;
  }

  login(returnUrl = this.router.url, reason?: 'expired'): void {
    this.clear();
    const queryParams = {
      ...(returnUrl && !returnUrl.startsWith('/login') ? { returnUrl } : {}),
      ...(reason ? { reason } : {}),
    };
    this.router.navigate(['/login'], { queryParams });
  }

  /** Revoke refresh token ở server (token bị lộ cũng vô dụng), rồi xóa phiên. Server lỗi vẫn đăng xuất. */
  logout(): void {
    const refreshToken = this.tokens?.refreshToken;
    this.clear();
    if (refreshToken) {
      this.http
        .post(`${this.apiUrl}/api/auth/logout`, { refreshToken })
        .subscribe({ error: () => undefined });
    }
    this.router.navigate(['/login']);
  }

  private setTokens(tokens: TokenResponse): void {
    this.tokens = tokens;
    writeStorage(tokens);
    this.user.set(
      userFromClaims(decodeJwtPayload<UserClaims>(tokens.accessToken)),
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
