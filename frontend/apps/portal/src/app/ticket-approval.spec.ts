import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AppRole, AuthService } from '@care/shared-data-access-auth';
import { provideUi } from '@care/shared-ui-layout';
import { provideAppConfig } from '@care/shared-util-config';
import { provideI18nTesting } from '@care/shared-util-i18n/testing';
import { appRoutes } from './app.routes';

/**
 * Integration test: route thật của app + trang danh sách phiếu + store + adapter HTTP thật.
 * Chỉ thay backend (HttpTestingController) và người đăng nhập.
 */
const API = 'http://api';

const resolved = {
  id: 42,
  code: 'TK-000042',
  title: 'Mat song khu vuc Cau Giay',
  category: 'NETWORK',
  priority: 'HIGH',
  status: 'RESOLVED',
  subscriberId: 7,
  subscriberMsisdn: '0912000007',
  subscriberName: 'Tran Thi B',
  assignee: 'agent1',
  description: null,
  createdBy: 'agent1',
  createdAt: '2026-10-01T08:00:00Z',
  updatedAt: '2026-10-02T08:00:00Z',
  version: 3,
};

const page = (content: object[]) => ({
  content,
  totalElements: content.length,
  number: 0,
  size: 20,
});

describe('Duyet phieu (integration: route + trang + store + HTTP)', () => {
  let http: HttpTestingController;
  const roles = signal<AppRole[]>(['AGENT', 'SUPERVISOR']);

  beforeEach(() => {
    roles.set(['AGENT', 'SUPERVISOR']);
    TestBed.configureTestingModule({
      providers: [
        provideRouter(appRoutes),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppConfig({ apiUrl: API }),
        provideUi(),
        provideI18nTesting(),
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: signal(true),
            username: signal('supervisor1'),
            roles,
            hasAnyRole: (...r: AppRole[]) => r.some((x) => roles().includes(x)),
            roleLabelKeys: computed(() => []),
          },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  const approveButtons = (el: HTMLElement | null) =>
    [...(el?.querySelectorAll('tbody button') ?? [])].filter((b) =>
      b.textContent?.includes('Duyệt'),
    );

  it('manager duyet phieu da xu ly', async () => {
    const harness = await RouterTestingHarness.create(
      '/tickets?status=RESOLVED',
    );
    http
      .expectOne((r) => r.url === `${API}/api/tickets`)
      .flush(page([resolved]));
    await harness.fixture.whenStable();

    (approveButtons(harness.routeNativeElement)[0] as HTMLElement).click();
    const req = http.expectOne((r) => r.url.endsWith('/approve'));
    req.flush({ ...resolved, status: 'CLOSED', version: 4 });

    expect(req.request.method).toBe('POST');
  });

  it('nguoi khac duyet truoc -> bao loi', async () => {
    const harness = await RouterTestingHarness.create(
      '/tickets?status=RESOLVED',
    );
    http
      .expectOne((r) => r.url === `${API}/api/tickets`)
      .flush(page([resolved]));
    await harness.fixture.whenStable();

    (approveButtons(harness.routeNativeElement)[0] as HTMLElement).click();
    http
      .expectOne((r) => r.url.endsWith('/approve'))
      .flush(
        { detail: 'Dữ liệu đã bị người khác thay đổi, vui lòng tải lại' },
        { status: 409, statusText: 'Conflict' },
      );
    await harness.fixture.whenStable();

    expect(harness.routeNativeElement?.querySelector('nz-alert')).toBeTruthy();
  });

  it('agent khong thay nut duyet', async () => {
    roles.set(['AGENT']);
    const harness = await RouterTestingHarness.create(
      '/tickets?status=RESOLVED',
    );

    expect(approveButtons(harness.routeNativeElement)).toHaveLength(0);
  });
});
