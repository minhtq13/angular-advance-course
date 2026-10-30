import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { TicketPort, TicketValidationError } from '@care/portal-domain-tickets';
import { InMemoryTicketAdapter } from '@care/portal-domain-tickets/testing';
import { SubscriberApi } from '@care/shared-data-access-api';
import { provideUi } from '@care/shared-ui-layout';
import { of } from 'rxjs';
import { provideI18nTesting } from '@care/shared-util-i18n/testing';
import { TicketCreatePage } from './ticket-create.page';

describe('TicketCreatePage', () => {
  let port: InMemoryTicketAdapter;

  beforeEach(async () => {
    port = new InMemoryTicketAdapter();
    await TestBed.configureTestingModule({
      imports: [TicketCreatePage],
      providers: [
        provideRouter([]),
        provideUi(),
        provideI18nTesting(),
        { provide: TicketPort, useValue: port },
        {
          provide: SubscriberApi,
          useValue: {
            get: (id: number) =>
              of({ id, msisdn: '0900000012', fullName: 'Tran Thi B' }),
            search: () => of({ content: [], totalElements: 0 }),
          },
        },
      ],
    }).compileComponents();
  });

  async function render(subscriberId = '12') {
    const fixture = TestBed.createComponent(TicketCreatePage);
    fixture.componentRef.setInput('subscriberId', subscriberId);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const input = (id: string) =>
      el.querySelector(`#${id}`) as HTMLInputElement;
    const type = async (id: string, value: string) => {
      input(id).value = value;
      input(id).dispatchEvent(new Event('input'));
      await fixture.whenStable();
    };
    const submit = async () => {
      (el.querySelector('button[type=submit]') as HTMLButtonElement).click();
      await fixture.whenStable();
    };
    return { fixture, el, input, type, submit };
  }

  /** nz-select không có input thật để gõ: đặt giá trị qua form control. */
  function chooseCategory(page: {
    fixture: { componentInstance: TicketCreatePage };
  }) {
    (
      page.fixture.componentInstance as unknown as {
        form: { controls: { category: { setValue(v: string): void } } };
      }
    ).form.controls.category.setValue('BILLING');
  }

  it('lay subscriberId tu query param va hien so thue bao', async () => {
    const { el } = await render('12');
    expect(el.querySelector('care-subscriber-picker')?.textContent).toContain(
      '0900000012',
    );
  });

  it('tieu de chi co khoang trang: khong goi API, bao loi dung truong va dua focus toi do', async () => {
    const page = await render();
    chooseCategory(page);
    await page.type('tk-title', '    ');
    await page.submit();

    expect(port.createCalls).toEqual([]);
    expect(page.input('tk-title').getAttribute('aria-invalid')).toBe('true');
    expect(page.el.querySelector('#tk-title-error')?.textContent).toContain(
      'Không được chỉ có khoảng trắng',
    );
    expect(page.input('tk-title').getAttribute('aria-describedby')).toBe(
      'tk-title-error',
    );
    expect(document.activeElement).toBe(page.input('tk-title'));
  });

  it('server tra loi tung truong: giu nguyen noi dung form, hien loi server dung truong', async () => {
    port.failNext(
      new TicketValidationError('Dữ liệu không hợp lệ', {
        title: 'Tiêu đề đã bị cấm',
      }),
    );
    const page = await render();
    chooseCategory(page);
    await page.type('tk-title', 'Mat song 4G');
    await page.type('tk-description', 'Tu sang nay');
    await page.submit();

    expect(port.createCalls).toHaveLength(1);
    expect(page.input('tk-title').value).toBe('Mat song 4G');
    expect(page.input('tk-description').value).toBe('Tu sang nay');
    expect(page.el.querySelector('#tk-title-error')?.textContent).toContain(
      'Tiêu đề đã bị cấm',
    );
    expect(page.el.querySelector('[role=alert]')?.textContent).toContain(
      'Dữ liệu không hợp lệ',
    );

    // Sửa lại giá trị -> lỗi server tự mất.
    await page.type('tk-title', 'Mat song 4G tai nha');
    expect(page.el.querySelector('#tk-title-error')).toBeNull();
  });

  it('loi mang: giu form, bao loi chung, nut gui bam lai duoc', async () => {
    port.failNext(new Error('network'));
    const page = await render();
    chooseCategory(page);
    await page.type('tk-title', 'Cuoc bat thuong');
    await page.submit();

    expect(page.el.querySelector('[role=alert]')?.textContent).toContain(
      'Không tạo được phiếu',
    );
    expect(page.input('tk-title').value).toBe('Cuoc bat thuong');
    expect(
      (page.el.querySelector('button[type=submit]') as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });

  it('thanh cong: gui lenh da trim va chuyen ve danh sach kem ma phieu', async () => {
    const navigate = vi
      .spyOn(TestBed.inject(Router), 'navigateByUrl')
      .mockResolvedValue(true);
    const page = await render('12');
    chooseCategory(page);
    await page.type('tk-title', '  Cuoc bat thuong  ');
    await page.submit();

    expect(port.createCalls[0].command).toEqual({
      subscriberId: 12,
      category: 'BILLING',
      priority: 'MEDIUM',
      title: 'Cuoc bat thuong',
      description: undefined,
    });
    expect(navigate).toHaveBeenCalledWith(
      TestBed.inject(Router).parseUrl('/tickets'),
      { state: { created: expect.stringMatching(/^TK-/) } },
    );
  });

  it.each([
    ['/tickets?status=RESOLVED&page=2', '/tickets?status=RESOLVED&page=2'],
    ['https://evil.example/phish', '/tickets'],
    ['//evil.example', '/tickets'],
    ['/admin/dashboard', '/tickets'],
  ])('returnUrl %s -> tao xong quay ve %s', async (returnUrl, expected) => {
    const navigate = vi
      .spyOn(TestBed.inject(Router), 'navigateByUrl')
      .mockResolvedValue(true);
    const page = await render('12');
    page.fixture.componentRef.setInput('returnUrl', returnUrl);
    chooseCategory(page);
    await page.type('tk-title', 'Cuoc bat thuong');
    await page.submit();

    expect(String(navigate.mock.calls[0][0])).toBe(expected);
  });

  it('gui lai sau loi dung lai cung Idempotency-Key (backend khong tao phieu thu hai)', async () => {
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    port.failNext(new Error('timeout'));
    const page = await render();
    chooseCategory(page);
    await page.type('tk-title', 'Cuoc bat thuong');
    await page.submit();
    await page.submit();

    expect(port.createCalls).toHaveLength(2);
    expect(port.createCalls[1].key).toBe(port.createCalls[0].key);
  });

  it('bam gui hai lan lien tiep khi dang gui: chi mot request', async () => {
    const page = await render();
    chooseCategory(page);
    await page.type('tk-title', 'Cuoc bat thuong');
    const button = page.el.querySelector(
      'button[type=submit]',
    ) as HTMLButtonElement;
    // Fake trả về đồng bộ nên giả lập "đang gửi" bằng cách chặn navigateByUrl lại.
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockReturnValue(
      new Promise(() => undefined),
    );
    button.click();
    button.click();
    await page.fixture.whenStable();

    expect(port.createCalls).toHaveLength(1);
  });
});
