import { importProvidersFrom } from '@angular/core';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { provideTranslocoLocale } from '@jsverse/transloco-locale';
import en from './assets/i18n/en.json';
import vi from './assets/i18n/vi.json';
import { DEFAULT_LANG, LANGUAGES, LOCALE_OF } from './lib/languages';

/** Dung trong unit test: nap san ban dich that (dong bo, khong goi HTTP). */
export function provideI18nTesting() {
  return [
    importProvidersFrom(
      TranslocoTestingModule.forRoot({
        langs: { vi, en },
        translocoConfig: {
          availableLangs: [...LANGUAGES],
          defaultLang: DEFAULT_LANG,
        },
        preloadLangs: true,
      }),
    ),
    provideTranslocoLocale({ langToLocaleMapping: { ...LOCALE_OF } }),
  ];
}
