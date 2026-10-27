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
/** CSS dark cua ng-zorro, copy vao /themes khi build (project.json -> assets). Chi tai khi can. */
const DARK_CSS_HREF = 'themes/ng-zorro-antd.dark.min.css';
const DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * Theme sang/toi. Mac dinh "system": theo cai dat he dieu hanh va tu doi khi he dieu hanh doi.
 * Script trong index.html da dat san data-theme truoc khi Angular chay (tranh nhay trang);
 * service nay tiep quan tu do.
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
    // Thanh cuon, o nhap mac dinh cua trinh duyet cung doi theo.
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
      // Phai dung SAU stylesheet sang cua ng-zorro thi moi ghi de duoc.
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
    // bo qua
  }
}
