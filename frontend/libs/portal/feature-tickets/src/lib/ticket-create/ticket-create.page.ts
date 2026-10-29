import {
  afterNextRender,
  ChangeDetectionStrategy,
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

/** Thong bao loi cua mot truong: key dich (loi client) hoac chu da dich san (loi server). */
type FieldError =
  { key: string; params?: Record<string, unknown> } | { text: string };

/** "?subscriberId=12" -> 12; thieu hoac sai -> undefined. */
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

  /** Tu query param (withComponentInputBinding): /tickets/new?subscriberId=12 */
  readonly subscriberId = input<number | undefined, unknown>(undefined, {
    transform: toId,
  });

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
   * Mot key cho mot lan "tao phieu". Gui lai sau loi mang dung lai key nay, nen neu request truoc
   * thuc ra da toi server thi backend tra lai dung phieu do thay vi tao phieu thu hai.
   */
  private idempotencyKey = crypto.randomUUID();
  /** Loi chung cua lan gui (dat tren form). null = khong co loi. */
  protected readonly submitError = signal<FieldError | null>(null);

  ngOnInit(): void {
    const id = this.subscriberId();
    if (id !== undefined) this.form.controls.subscriberId.setValue(id);
  }

  protected submit(): void {
    // Chong nhap lap phia client. Khong thay duoc idempotency phia server (mang cham, tu dong gui lai, hai tab).
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
          this.router.navigate(['/tickets'], {
            state: { created: ticket.code },
          });
        },
        // Khong reset form: nguoi dung sua hoac gui lai ma khong phai nhap lai.
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

  /** Loi dau tien cua truong, chi hien sau khi nguoi dung da cham vao (hoac da bam gui). */
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

  /** Loi tu server gan vao dung truong; tu mat khi nguoi dung sua gia tri (validator chay lai). */
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
        // nz-select dat aria-invalid tren the bao ngoai: focus vao o nhap ben trong.
        const target = invalid?.matches('input, textarea')
          ? invalid
          : invalid?.querySelector<HTMLElement>('input');
        target?.focus();
      },
      { injector: this.injector },
    );
  }
}
