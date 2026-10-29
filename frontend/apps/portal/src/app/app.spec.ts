import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '@care/shared-data-access-auth';
import { provideUi } from '@care/shared-ui-layout';
import { APP_CONFIG } from '@care/shared-util-config';
import { provideI18nTesting } from '@care/shared-util-i18n/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideUi(),
        provideI18nTesting(),
        {
          provide: APP_CONFIG,
          useValue: {
            environmentName: 'TEST',
            apiUrl: '',
          },
        },
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: signal(true),
            displayName: signal('Agent One'),
            roleLabelKeys: signal(['roles.AGENT']),
            logout: () => undefined,
          },
        },
      ],
    }).compileComponents();
  });

  it('hien thi ten app va nguoi dung', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.brand')?.textContent).toContain('Care Portal');
    expect(el.querySelector('.user-info')?.textContent).toContain('Agent One');
  });
});
