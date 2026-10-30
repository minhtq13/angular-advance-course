import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '@care/shared-data-access-auth';
import { provideUi } from '@care/shared-ui-layout';
import { provideI18nTesting } from '@care/shared-util-i18n/testing';
import { LoginPage } from './login.page';

describe('LoginPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        provideUi(),
        provideI18nTesting(),
        { provide: AuthService, useValue: {} },
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
});
