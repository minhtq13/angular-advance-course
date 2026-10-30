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

  /** Mở danh sách phiếu đã xử lý, trả về một trang có phiếu TK-000042 từ "backend". */
  async function openResolvedList() {
    const harness = await RouterTestingHarness.create(
      '/tickets?status=RESOLVED',
    );
    const list = http.expectOne((r) => r.url === `${API}/api/tickets`);
    expect(list.request.params.get('status')).toBe('RESOLVED');
    list.flush(page([resolved]));
    await harness.fixture.whenStable();
    const el = harness.routeNativeElement as HTMLElement;
    expect(el.textContent).toContain('TK-000042');
    return { harness, el };
  }

  it('manager duyet: gui dung phieu va version dang thay, bao thanh cong, tai lai cung bo loc', async () => {
    const { harness, el } = await openResolvedList();

    (approveButtons(el)[0] as HTMLElement).click();
    const req = http.expectOne(`${API}/api/tickets/42/approve`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ version: 3 });
    req.flush({ ...resolved, status: 'CLOSED', version: 4 });

    // Danh sách tải lại với đúng bộ lọc: phiếu vừa duyệt biến khỏi "Đã xử lý".
    const reload = http.expectOne((r) => r.url === `${API}/api/tickets`);
    expect(reload.request.params.get('status')).toBe('RESOLVED');
    reload.flush(page([]));
    await harness.fixture.whenStable();
    expect(el.textContent).toContain('Đã duyệt phiếu TK-000042');
    expect(el.textContent).not.toContain('Mat song khu vuc Cau Giay');
  });

  it('nguoi khac duyet truoc (409) -> noi ro ly do tu server, chi tai lai khi nguoi dung chon', async () => {
    const { harness, el } = await openResolvedList();

    (approveButtons(el)[0] as HTMLElement).click();
    http
      .expectOne(`${API}/api/tickets/42/approve`)
      .flush(
        { detail: 'Dữ liệu đã bị người khác thay đổi, vui lòng tải lại' },
        { status: 409, statusText: 'Conflict' },
      );
    await harness.fixture.whenStable();

    const alert = el.querySelector('[role=alert]');
    expect(alert?.textContent).toContain('Không duyệt được phiếu');
    expect(alert?.textContent).toContain('Dữ liệu đã bị người khác thay đổi');
    expect(el.textContent).not.toContain('Đã duyệt phiếu');
    http.expectNone((r) => r.url === `${API}/api/tickets`);

    const reloadButton = [...(alert?.querySelectorAll('button') ?? [])].find(
      (b) => b.textContent?.includes('Tải lại danh sách'),
    );
    reloadButton?.click();
    http.expectOne((r) => r.url === `${API}/api/tickets`).flush(page([]));
  });

  it('agent thay phieu da xu ly nhung khong co nut duyet', async () => {
    roles.set(['AGENT']);
    const { el } = await openResolvedList();

    expect(el.querySelectorAll('tbody tr.ant-table-row')).toHaveLength(1);
    expect(approveButtons(el)).toHaveLength(0);
  });

  afterEach(() => http.verify());
});
