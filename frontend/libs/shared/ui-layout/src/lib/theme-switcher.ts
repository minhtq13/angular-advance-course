import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NzIconDirective } from 'ng-zorro-antd/icon';
import {
  THEME_PREFERENCES,
  ThemePreference,
  ThemeService,
} from './theme.service';

const ICON: Record<ThemePreference, string> = {
  light: 'sun',
  dark: 'moon',
  system: 'desktop',
};

/** Nhom nut Sang | Toi | Theo he thong. Nut chi co icon -> bat buoc co aria-label va title. */
@Component({
  selector: 'care-theme-switcher',
  imports: [TranslocoPipe, NzIconDirective],
  template: `
    <div
      class="segmented"
      role="group"
      [attr.aria-label]="'theme.label' | transloco"
      [class.on-dark]="onDark()"
    >
      @for (option of options; track option) {
        <button
          type="button"
          [attr.aria-pressed]="theme.preference() === option"
          [attr.aria-label]="'theme.' + option | transloco"
          [title]="'theme.' + option | transloco"
          (click)="theme.setPreference(option)"
        >
          <nz-icon [nzType]="icons[option]" aria-hidden="true" />
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeSwitcher {
  protected readonly theme = inject(ThemeService);
  protected readonly options = THEME_PREFERENCES;
  protected readonly icons = ICON;
  /** true khi dat tren nen toi (header). */
  readonly onDark = input(false);
}
