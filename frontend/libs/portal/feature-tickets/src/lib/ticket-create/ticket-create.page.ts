import {
  afterNextRender,
  ChangeDetectionStrategy,
  computed,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  TicketCategory,
  TicketPort,
  TicketPriority,
  TicketValidationError,
} from '@care/portal-domain-tickets';
import { safeReturnUrl } from '@care/shared-data-access-auth';
import {
  TICKET_CATEGORY,
  TICKET_PRIORITY,
  toOptions,
} from '@care/shared-data-access-api';
import { TranslocoPipe } from '@jsverse/transloco';
import { NzAlertComponent } from 'ng-zorro-antd/alert';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzOptionComponent, NzSelectComponent } from 'ng-zorro-antd/select';
import { SubscriberPicker } from '../subscriber-picker/subscriber-picker';
import { notBlank } from './not-blank.validator';

const TITLE_MAX = 200;
const DESCRIPTION_MAX = 4000;

type FieldName =
  'subscriberId' | 'category' | 'priority' | 'title' | 'description';

/** Thông báo lỗi của một trường: key dịch (lỗi client) hoặc chữ đã dịch sẵn (lỗi server). */
type FieldError =
  { key: string; params?: Record<string, unknown> } | { text: string };

const LIST_URL = '/tickets';

/**
 * Chỉ quay về danh sách phiếu (kèm bộ lọc của nó); URL khác -> danh sách mặc định.
 * returnUrl đến từ query param: không tin, chống open redirect.
 */
function backToList(url: unknown): string {
  const safe = safeReturnUrl(url);
  return safe === LIST_URL || safe.startsWith(`${LIST_URL}?`) ? safe : LIST_URL;
}

/** "?subscriberId=12" -> 12; thiếu hoặc sai -> undefined. */
function toId(value: unknown): number | undefined {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
}

@Component({
  selector: 'care-ticket-create-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslocoPipe,
    NzAlertComponent,
    NzButtonComponent,
    NzFormModule,
    NzInputModule,
    NzSelectComponent,
    NzOptionComponent,
    SubscriberPicker,
  ],
  templateUrl: './ticket-create.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketCreatePage implements OnInit {
  private readonly tickets = inject(TicketPort);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  /** Từ query param (withComponentInputBinding): /tickets/new?subscriberId=12 */
  readonly subscriberId = input<number | undefined, unknown>(undefined, {
    transform: toId,
  });
  /** Danh sách (kèm bộ lọc) để quay về sau khi tạo hoặc khi bấm Hủy: /tickets/new?returnUrl=%2Ftickets%3Fstatus%3DNEW */
  readonly returnUrl = input<string>();
  protected readonly backUrl = computed(() =>
    this.router.parseUrl(backToList(this.returnUrl())),
  );

  protected readonly categoryOptions = toOptions(TICKET_CATEGORY);
  protected readonly priorityOptions = toOptions(TICKET_PRIORITY);
  protected readonly titleMax = TITLE_MAX;

  protected readonly form = new FormGroup({
    subscriberId: new FormControl<number | null>(null, Validators.required),
    category: new FormControl<TicketCategory | null>(null, Validators.required),
    priority: new FormControl<TicketPriority>('MEDIUM', {
      nonNullable: true,
      validators: Validators.required,
    }),
    title: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        notBlank,
        Validators.maxLength(TITLE_MAX),
      ],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: Validators.maxLength(DESCRIPTION_MAX),
    }),
  });

  protected readonly submitting = signal(false);

  /**
   * Một key cho một lần "tạo phiếu". Gửi lại sau lỗi mạng dùng lại key này, nên nếu request trước
   * thực ra đã tới server thì backend trả lại đúng phiếu đó thay vì tạo phiếu thứ hai.
   */
  private idempotencyKey = crypto.randomUUID();
  /** Lỗi chung của lần gửi (đặt trên form). null = không có lỗi. */
  protected readonly submitError = signal<FieldError | null>(null);

  ngOnInit(): void {
    const id = this.subscriberId();
    if (id !== undefined) this.form.controls.subscriberId.setValue(id);
  }

  protected submit(): void {
    // Chống nhập lặp phía client. Không thay được idempotency phía server (mạng chậm, tự động gửi lại, hai tab).
    if (this.submitting()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.submitError.set({ key: 'ticket.form.invalid' });
      this.focusFirstInvalid();
      return;
    }

    const value = this.form.getRawValue();
    this.submitting.set(true);
    this.submitError.set(null);
    this.tickets
      .create(
        {
          subscriberId: value.subscriberId as number,
          category: value.category as TicketCategory,
          priority: value.priority,
          title: value.title.trim(),
          description: value.description.trim() || undefined,
        },
        this.idempotencyKey,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (ticket) => {
          this.idempotencyKey = crypto.randomUUID();
          // Về đúng danh sách đang lọc; danh sách tải lại từ server nên thấy ngay phiếu mới.
          this.router.navigateByUrl(this.backUrl(), {
            state: { created: ticket.code },
          });
        },
        // Không reset form: người dùng sửa hoặc gửi lại mà không phải nhập lại.
        error: (error: unknown) => {
          this.submitting.set(false);
          if (error instanceof TicketValidationError) {
            this.applyServerErrors(error.fieldErrors);
            this.submitError.set({ text: error.message });
            this.focusFirstInvalid();
          } else {
            this.submitError.set({ key: 'ticket.form.submitError' });
          }
        },
      });
  }

  /** Lỗi đầu tiên của trường, chỉ hiện sau khi người dùng đã chạm vào (hoặc đã bấm gửi). */
  protected errorOf(name: FieldName): FieldError | null {
    const control: AbstractControl = this.form.controls[name];
    if (!control.touched || !control.errors) return null;
    const errors = control.errors;
    if (errors['server']) return { text: errors['server'] as string };
    if (errors['required']) return { key: 'ticket.form.errors.required' };
    if (errors['blank']) return { key: 'ticket.form.errors.blank' };
    if (errors['maxlength']) {
      return {
        key: 'ticket.form.errors.maxlength',
        params: { max: errors['maxlength'].requiredLength },
      };
    }
    return null;
  }

  /** Lỗi từ server gắn vào đúng trường; tự mất khi người dùng sửa giá trị (validator chạy lại). */
  private applyServerErrors(
    fieldErrors: Readonly<Record<string, string>>,
  ): void {
    for (const [field, message] of Object.entries(fieldErrors)) {
      const control = this.form.get(field);
      if (!control) continue;
      control.setErrors({ ...control.errors, server: message });
      control.markAsTouched();
    }
  }

  private focusFirstInvalid(): void {
    afterNextRender(
      () => {
        const invalid = this.host.nativeElement.querySelector<HTMLElement>(
          '[aria-invalid="true"]',
        );
        // nz-select đặt aria-invalid trên thẻ bao ngoài: focus vào ô nhập bên trong.
        const target = invalid?.matches('input, textarea')
          ? invalid
          : invalid?.querySelector<HTMLElement>('input');
        target?.focus();
      },
      { injector: this.injector },
    );
  }
}
