import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { LoginResponse, OidcSecurityService } from 'angular-auth-oidc-client';
import { finalize, firstValueFrom, map, Observable, share, tap } from 'rxjs';
import { safeReturnUrl } from './auth.guard';
import { AuthService, UserClaims, userFromClaims } from './auth.service';
import { decodeJwtPayload } from './jwt';

/** Keycloak gửi người dùng quay lại đây kèm ?code=...&state=... (phải khớp redirect URI đăng ký ở client). */
export const OIDC_CALLBACK_PATH = '/auth/callback';
const RETURN_URL_KEY = 'care.returnUrl';
const ANONYMOUS: LoginResponse = {
  isAuthenticated: false,
  userData: null,
  accessToken: '',
  idToken: '',
};

/**
 * Đăng nhập qua máy chủ định danh OIDC (Keycloak) bằng Authorization Code + PKCE.
 * Thư viện angular-auth-oidc-client lo phần giao thức: tạo code_verifier/state/nonce, đổi code lấy token,
 * kiểm tra ID token, refresh token. Lớp này chỉ nối thư viện vào port AuthService của app.
 */
@Injectable({ providedIn: 'root' })
export class OidcAuthService extends AuthService {
  readonly mode = 'oidc';

  private readonly oidc = inject(OidcSecurityService);
  private readonly router = inject(Router);

  private token: string | null = null;
  private refreshing: Observable<string> | null = null;

  /**
   * checkAuth: nếu URL là callback (?code=&state=) thì đổi code lấy token, nếu không thì đọc phiên đã lưu.
   * Chạy trước lần điều hướng đầu tiên của router -> thay URL callback bằng trang người dùng định vào.
   */
  async init(): Promise<void> {
    // Callback lỗi (state không khớp, code giả hoặc hết hạn, Keycloak không tới được) -> coi như chưa đăng nhập,
    // app vẫn khởi động và về /login. Để lỗi lọt ra khỏi app initializer là trang trắng.
    const result = await firstValueFrom(this.oidc.checkAuth()).catch(
      (): LoginResponse => ANONYMOUS,
    );
    this.apply(result);
    if (location.pathname === OIDC_CALLBACK_PATH) {
      history.replaceState(
        null,
        '',
        result.isAuthenticated ? takeReturnUrl() : '/login',
      );
    }
  }

  accessToken(): string | null {
    return this.token;
  }

  /** Thư viện dùng refresh token (rotation ở Keycloak) để lấy token mới; dùng chung như buổi 6. */
  refresh(): Observable<string> {
    this.refreshing ??= this.oidc.forceRefreshSession().pipe(
      map((result) => {
        this.apply(result);
        if (!this.token) {
          throw new Error('OIDC: refresh that bai');
        }
        return this.token;
      }),
      // Refresh token hết hạn hoặc bị revoke ở Keycloak -> phiên kết thúc, đăng xuất một lần.
      tap({ error: () => this.login(this.router.url, 'expired') }),
      finalize(() => (this.refreshing = null)),
      share(),
    );
    return this.refreshing;
  }

  loginWithPassword(): Observable<void> {
    throw new Error('OidcAuthService: dang nhap qua may chu dinh danh');
  }

  loginWithSso(returnUrl: string): void {
    saveReturnUrl(safeReturnUrl(returnUrl));
    this.oidc.authorize();
  }

  login(returnUrl = this.router.url, reason?: 'expired'): void {
    this.oidc.logoffLocal();
    this.user.set(null);
    this.token = null;
    const queryParams = {
      ...(returnUrl && !returnUrl.startsWith('/login') ? { returnUrl } : {}),
      ...(reason ? { reason } : {}),
    };
    this.router.navigate(['/login'], { queryParams });
  }

  /**
   * Kết thúc cả phiên SSO (RP-initiated logout): revoke refresh token, rồi chuyển trình duyệt tới
   * end_session_endpoint kèm id_token_hint; Keycloak xóa cookie phiên và quay về postLogoutRedirectUri (/login).
   * Chỉ xóa token trong tab (logoffLocal) thì cookie phiên Keycloak vẫn còn: người sau bấm SSO là vào luôn tài khoản cũ.
   */
  logout(): void {
    this.user.set(null);
    this.token = null;
    this.oidc.logoffAndRevokeTokens().subscribe({
      // Không tới được Keycloak: ít nhất xóa phiên trong tab.
      error: () => {
        this.oidc.logoffLocal();
        this.router.navigate(['/login']);
      },
    });
  }

  private apply(result: LoginResponse): void {
    if (!result.isAuthenticated) {
      this.token = null;
      this.user.set(null);
      return;
    }
    // Access token cho API (aud = care-api). ID token chỉ để app biết ai đăng nhập (aud = care-portal),
    // gửi ID token tới API -> 401 "The aud claim is not valid".
    this.token = result.accessToken;
    this.user.set(userFromClaims(decodeJwtPayload<UserClaims>(result.idToken)));
  }
}

// Giữ trang định vào qua chuyến đi sang Keycloak (cả trang bị tải lại). sessionStorage có thể bị chặn.
function saveReturnUrl(url: string): void {
  try {
    sessionStorage.setItem(RETURN_URL_KEY, url);
  } catch {
    // bỏ qua: quay về trang chủ
  }
}

function takeReturnUrl(): string {
  try {
    const url = sessionStorage.getItem(RETURN_URL_KEY);
    sessionStorage.removeItem(RETURN_URL_KEY);
    return safeReturnUrl(url);
  } catch {
    return '/';
  }
}
