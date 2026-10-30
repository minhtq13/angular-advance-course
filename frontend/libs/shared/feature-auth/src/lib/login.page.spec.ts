import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '@care/shared-data-access-auth';
import { provideUi } from '@care/shared-ui-layout';
import { provideI18nTesting } from '@care/shared-util-i18n/testing';
import { LoginPage } from './login.page';

describe('LoginPage', () => {
  const auth = { mode: 'local', loginWithSso: vi.fn() };

  beforeEach(async () => {
    auth.mode = 'local';
    auth.loginWithSso.mockReset();
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        provideUi(),
        provideI18nTesting(),
        { provide: AuthService, useValue: auth },
      ],
    }).compileComponents();
  });

  it('bi dang xuat vi het phien (?reason=expired) -> noi ro ly do', async () => {
    const fixture = TestBed.createComponent(LoginPage);
    fixture.componentRef.setInput('reason', 'expired');
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain(
      'Phiên đăng nhập đã hết hạn',
    );
  });

  it('vao thang trang dang nhap -> khong hien thong bao', async () => {
    const fixture = TestBed.createComponent(LoginPage);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('hết hạn');
  });

  it('che do oidc -> khong co form, nut SSO giu trang dinh vao (chan open redirect)', async () => {
    auth.mode = 'oidc';
    const fixture = TestBed.createComponent(LoginPage);
    fixture.componentRef.setInput('returnUrl', '/tickets?status=NEW');
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const ssoButton = () =>
      [...el.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('Đăng nhập bằng SSO'),
      );

    expect(el.querySelector('form')).toBeNull();
    expect(ssoButton()).toBeDefined();
    ssoButton()?.click();
    expect(auth.loginWithSso).toHaveBeenCalledWith('/tickets?status=NEW');

    fixture.componentRef.setInput('returnUrl', '//evil.com');
    ssoButton()?.click();
    expect(auth.loginWithSso).toHaveBeenLastCalledWith('/');
  });
});
