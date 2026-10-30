import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { LANGUAGES, LanguageService } from '@care/shared-util-i18n';
import { TranslocoPipe } from '@jsverse/transloco';

/**
 * Nhóm nút VI | EN. Dùng nút thật + aria-pressed (không dùng dropdown) để thao tác
 * được ngay bằng bàn phím và trình đọc màn hình đọc rõ trạng thái đang chọn.
 */
@Component({
  selector: 'care-language-switcher',
  imports: [TranslocoPipe],
  template: `
    <div
      class="segmented"
      role="group"
      [attr.aria-label]="'language.label' | transloco"
      [class.on-dark]="onDark()"
    >
      @for (code of languages; track code) {
        <button
          type="button"
          [attr.aria-pressed]="language.lang() === code"
          [attr.lang]="code"
          [attr.aria-label]="'language.' + code | transloco"
          (click)="language.use(code)"
        >
          {{ code.toUpperCase() }}
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitcher {
  protected readonly language = inject(LanguageService);
  protected readonly languages = LANGUAGES;
  /** true khi đặt trên nền tối (header). */
  readonly onDark = input(false);
}
