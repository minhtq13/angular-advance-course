import { importProvidersFrom } from '@angular/core';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { provideTranslocoLocale } from '@jsverse/transloco-locale';
import en from './assets/i18n/en.json';
import vi from './assets/i18n/vi.json';
import { DEFAULT_LANG, LANGUAGES, LOCALE_OF } from './lib/languages';

/** Dùng trong unit test: nạp sẵn bản dịch thật (đồng bộ, không gọi HTTP). */
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
