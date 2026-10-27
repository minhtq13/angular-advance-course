import { computed, signal } from '@angular/core';

export type AppRole = 'AGENT' | 'SUPERVISOR' | 'ADMIN';

const APP_ROLES: readonly string[] = ['AGENT', 'SUPERVISOR', 'ADMIN'];

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

/** Claim trong access token. Che do local dung "roles", Keycloak dung "realm_access.roles". */
export interface AccessTokenClaims {
  preferred_username?: string;
  name?: string;
  roles?: string[];
  realm_access?: { roles?: string[] };
}

export function userFromClaims(claims: AccessTokenClaims): AuthUser {
  const username = claims.preferred_username ?? '';
  const roles = claims.roles ?? claims.realm_access?.roles ?? [];
  return {
    username,
    displayName: claims.name ?? username,
    // Bo cac role mac dinh cua Keycloak (offline_access, uma_authorization, ...).
    roles: roles.filter((role) => APP_ROLES.includes(role)) as AppRole[],
  };
}

/**
 * Hop dong chung cho moi cach dang nhap. Guard, interceptor va man hinh chi phu thuoc lop nay,
 * khong biet ben duoi la LocalAuthService (JWT tu backend) hay OidcAuthService (Keycloak).
 */
export abstract class AuthService {
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

  /** Chay trong provideAppInitializer, truoc khi app render. */
  abstract init(): Promise<void>;

  abstract accessToken(): string | null;

  /** Dua nguoi dung toi buoc dang nhap; sau khi xong quay lai returnUrl. */
  abstract login(returnUrl?: string): void;

  abstract logout(): void;
}
