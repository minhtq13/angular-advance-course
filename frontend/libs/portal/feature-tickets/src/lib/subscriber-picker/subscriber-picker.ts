import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { Subscriber, SubscriberApi } from '@care/shared-data-access-api';
import { TranslocoPipe } from '@jsverse/transloco';
import { NzOptionComponent, NzSelectComponent } from 'ng-zorro-antd/select';
import { map, Observable, Subject } from 'rxjs';
import { idleLookup, lookup } from './lookup';

export interface SubscriberOption {
  id: number;
  msisdn: string;
  fullName: string;
}

function toOption(s: Subscriber): SubscriberOption {
  return { id: s.id, msisdn: s.msisdn, fullName: s.fullName };
}

/**
 * Ô chọn thuê bao có tìm kiếm (số thuê bao, CCCD, tên). Dùng như một form control:
 * <care-subscriber-picker formControlName="subscriberId" />. Giá trị là id thuê bao.
 */
@Component({
  selector: 'care-subscriber-picker',
  imports: [FormsModule, TranslocoPipe, NzSelectComponent, NzOptionComponent],
  templateUrl: './subscriber-picker.html',
  styles: ':host { display: block; } .picker { width: 100%; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SubscriberPicker),
      multi: true,
    },
  ],
})
export class SubscriberPicker implements ControlValueAccessor {
  private readonly api = inject(SubscriberApi);
  private readonly destroyRef = inject(DestroyRef);

  /** id của ô nhập bên trong, để <label for> trỏ tới. */
  readonly inputId = input<string | null>(null);
  readonly invalid = input(false);
  readonly describedBy = input<string | null>(null);

  private readonly terms = new Subject<string>();
  /**
   * toSignal đăng ký trong injection context và tự unsubscribe khi component bị hủy:
   * request đang chạy bị hủy theo (switchMap -> unsubscribe -> abort XHR).
   */
  protected readonly state = toSignal(
    this.terms.pipe(lookup((term) => this.search(term))),
    { initialValue: idleLookup<SubscriberOption>() },
  );

  protected readonly selected = signal<SubscriberOption | null>(null);
  protected readonly disabled = signal(false);
  /** Giữ thuê bao đang chọn trong danh sách, kể cả khi kết quả tìm mới không có nó (nz-select cần option để hiện nhãn). */
  protected readonly options = computed(() => {
    const selected = this.selected();
    const items = this.state().items;
    return selected && !items.some((o) => o.id === selected.id)
      ? [selected, ...items]
      : items;
  });

  private onChange: (id: number | null) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  protected onSearch(term: string): void {
    this.terms.next(term);
  }

  protected onSelect(id: number | null): void {
    this.selected.set(this.options().find((o) => o.id === id) ?? null);
    this.onChange(id);
  }

  writeValue(id: number | null): void {
    if (id === null || id === undefined) {
      this.selected.set(null);
      return;
    }
    if (this.selected()?.id === id) return;
    // Giá trị đặt từ ngoài (vd ?subscriberId=12): lấy thông tin để hiện nhãn.
    this.api
      .get(id)
      .pipe(map(toOption), takeUntilDestroyed(this.destroyRef))
      .subscribe((option) => this.selected.set(option));
  }

  registerOnChange(fn: (id: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }

  private search(term: string): Observable<SubscriberOption[]> {
    return this.api
      .search({ q: term }, { page: 0, size: 10 })
      .pipe(map((page) => page.content.map(toOption)));
  }
}
