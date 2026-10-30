import { computed, signal } from '@angular/core';
import { Observable } from 'rxjs';

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

/**
 * Claim mô tả người dùng: access token do backend phát (TokenService.issue)
 * hoặc ID token của Keycloak (mapper "roles" trong infra/keycloak/care-realm.json).
 */
export interface UserClaims {
  preferred_username?: string;
  name?: string;
  roles?: string[];
}

export function userFromClaims(claims: UserClaims): AuthUser {
  const username = claims.preferred_username ?? '';
  const roles = (claims.roles ?? []).filter((role): role is AppRole =>
    Object.hasOwn(ROLE_LABEL_KEYS, role),
  );
  return { username, displayName: claims.name ?? username, roles };
}

export type AuthMode = 'local' | 'oidc';

/**
 * Port xác thực: guard, interceptor, màn hình chỉ biết lớp này (cùng ý tưởng TicketPort ở buổi 1).
 * Hai adapter: LocalAuthService (JWT do backend phát, mặc định) và OidcAuthService (Keycloak, buổi 7).
 * App chọn adapter trong provideAuth(config.auth) (composition root); không cấu hình gì thì dùng local.
 * Abstract class thay vì interface để làm luôn DI token.
 */
export abstract class AuthService {
  abstract readonly mode: AuthMode;

  protected readonly user = signal<AuthUser | null>(null);

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

  /** Chạy trong provideAppInitializer, trước khi app render: khôi phục phiên (và xử lý callback OIDC). */
  abstract init(): Promise<void>;

  /** Token gửi kèm request tới API (interceptor gắn vào header Authorization). */
  abstract accessToken(): string | null;

  /** Lấy access token mới khi API trả 401; dùng chung một request cho mọi người gọi đồng thời. */
  abstract refresh(): Observable<string>;

  /** Chế độ local: đăng nhập bằng form. */
  abstract loginWithPassword(
    username: string,
    password: string,
  ): Observable<void>;

  /** Chế độ OIDC: chuyển trình duyệt sang máy chủ định danh, xong quay lại returnUrl. */
  abstract loginWithSso(returnUrl: string): void;

  /**
   * Đưa người dùng tới trang đăng nhập; sau khi xong quay lại returnUrl.
   * reason 'expired': phiên kết thúc ngoài ý muốn -> trang đăng nhập nói rõ lý do.
   */
  abstract login(returnUrl?: string, reason?: 'expired'): void;

  abstract logout(): void;
}
