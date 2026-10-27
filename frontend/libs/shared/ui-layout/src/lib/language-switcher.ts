import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { LANGUAGES, LanguageService } from '@care/shared-util-i18n';
import { TranslocoPipe } from '@jsverse/transloco';

/**
 * Nhom nut VI | EN. Dung nut that + aria-pressed (khong dung dropdown) de thao tac
 * duoc ngay bang ban phim va trinh doc man hinh doc ro trang thai dang chon.
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
  /** true khi dat tren nen toi (header). */
  readonly onDark = input(false);
}
