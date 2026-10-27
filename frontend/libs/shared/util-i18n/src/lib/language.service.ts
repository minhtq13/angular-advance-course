import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { en_US, NzI18nService, vi_VN } from 'ng-zorro-antd/i18n';
import { firstValueFrom } from 'rxjs';
import { DEFAULT_LANG, isLang, Lang } from './languages';

const STORAGE_KEY = 'care.lang';

/**
 * Nguon su that duy nhat cho ngon ngu dang dung. Doi ngon ngu -> dong bo:
 * Transloco (chu), ng-zorro (phan trang, bang rong...), <html lang> (trinh doc man hinh), localStorage.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly transloco = inject(TranslocoService);
  private readonly nzI18n = inject(NzI18nService);
  private readonly document = inject(DOCUMENT);

  private readonly current = signal<Lang>(DEFAULT_LANG);
  readonly lang = this.current.asReadonly();

  /** Chay truoc khi app render: tai san file dich -> khong nhap nhay key tho. */
  async init(): Promise<void> {
    const saved = readStorage();
    await this.use(isLang(saved) ? saved : DEFAULT_LANG);
  }

  async use(lang: Lang): Promise<void> {
    await firstValueFrom(this.transloco.load(lang));
    this.transloco.setActiveLang(lang);
    this.nzI18n.setLocale(lang === 'en' ? en_US : vi_VN);
    this.document.documentElement.lang = lang;
    this.current.set(lang);
    writeStorage(lang);
  }
}

// localStorage co the bi chan (che do rieng tu) -> khong de app loi vi no.
function readStorage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStorage(lang: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // bo qua
  }
}
