import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let systemDark = false;
  const listeners: ((e: { matches: boolean }) => void)[] = [];

  beforeEach(() => {
    localStorage.clear();
    listeners.length = 0;
    document.getElementById('care-dark-theme')?.remove();
    window.matchMedia = ((query: string) => ({
      matches: systemDark,
      media: query,
      addEventListener: (_: string, cb: (e: { matches: boolean }) => void) =>
        listeners.push(cb),
      removeEventListener: () => undefined,
    })) as unknown as typeof window.matchMedia;
  });

  const create = () => {
    const service = TestBed.inject(ThemeService);
    TestBed.tick();
    return service;
  };

  it('mac dinh theo he thong (sang)', () => {
    systemDark = false;
    const service = create();

    expect(service.preference()).toBe('system');
    expect(document.documentElement.dataset['theme']).toBe('light');
    expect(document.getElementById('care-dark-theme')).toBeNull();
  });

  it('chon Toi: dat data-theme, tai CSS dark cua ng-zorro va ghi nho', () => {
    systemDark = false;
    const service = create();

    service.setPreference('dark');
    TestBed.tick();

    expect(document.documentElement.dataset['theme']).toBe('dark');
    const link = document.getElementById('care-dark-theme') as HTMLLinkElement;
    expect(link.href).toContain('themes/ng-zorro-antd.dark.min.css');
    expect(link.disabled).toBe(false);
    expect(localStorage.getItem('care.theme')).toBe('dark');

    service.setPreference('light');
    TestBed.tick();
    expect(document.documentElement.dataset['theme']).toBe('light');
    expect(link.disabled).toBe(true);
  });

  it('che do he thong tu doi khi he dieu hanh doi', () => {
    systemDark = false;
    create();

    listeners.forEach((cb) => cb({ matches: true }));
    TestBed.tick();

    expect(document.documentElement.dataset['theme']).toBe('dark');
  });
});
