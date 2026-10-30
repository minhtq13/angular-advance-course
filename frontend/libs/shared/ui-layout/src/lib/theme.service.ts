import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Injectable, signal } from '@angular/core';

export type ThemePreference = 'light' | 'dark' | 'system';
export type Theme = 'light' | 'dark';
export const THEME_PREFERENCES: readonly ThemePreference[] = [
  'light',
  'dark',
  'system',
];

const STORAGE_KEY = 'care.theme';
const DARK_LINK_ID = 'care-dark-theme';
/** CSS dark của ng-zorro, copy vào /themes khi build (project.json -> assets). Chỉ tải khi cần. */
const DARK_CSS_HREF = 'themes/ng-zorro-antd.dark.min.css';
const DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * Theme sáng/tối. Mặc định "system": theo cài đặt hệ điều hành và tự đổi khi hệ điều hành đổi.
 * Script trong index.html đã đặt sẵn data-theme trước khi Angular chạy (tránh nháy trang);
 * service này tiếp quản từ đó.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly media = this.document.defaultView?.matchMedia?.(DARK_QUERY);

  private readonly systemDark = signal(this.media?.matches ?? false);
  readonly preference = signal<ThemePreference>(readPreference());
  readonly theme = computed<Theme>(() => {
    const preference = this.preference();
    return preference === 'system'
      ? this.systemDark()
        ? 'dark'
        : 'light'
      : preference;
  });

  constructor() {
    this.media?.addEventListener('change', (e) =>
      this.systemDark.set(e.matches),
    );
    effect(() => this.apply(this.theme()));
  }

  setPreference(preference: ThemePreference): void {
    this.preference.set(preference);
    writePreference(preference);
  }

  private apply(theme: Theme): void {
    const html = this.document.documentElement;
    html.dataset['theme'] = theme;
    // Thanh cuộn, ô nhập mặc định của trình duyệt cũng đổi theo.
    html.style.colorScheme = theme;

    let link = this.document.getElementById(
      DARK_LINK_ID,
    ) as HTMLLinkElement | null;
    if (theme === 'dark' && !link) {
      link = this.document.createElement('link');
      link.id = DARK_LINK_ID;
      link.rel = 'stylesheet';
      link.href = DARK_CSS_HREF;
    }
    if (link) {
      // Phải dùng SAU stylesheet sáng của ng-zorro thì mới ghi đè được.
      this.document.head.appendChild(link);
      link.disabled = theme !== 'dark';
    }
  }
}

function readPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' || value === 'system'
      ? value
      : 'system';
  } catch {
    return 'system';
  }
}

function writePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // bỏ qua
  }
}
