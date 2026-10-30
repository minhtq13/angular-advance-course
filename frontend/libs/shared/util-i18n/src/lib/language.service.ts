import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { en_US, NzI18nService, vi_VN } from 'ng-zorro-antd/i18n';
import { firstValueFrom } from 'rxjs';
import { DEFAULT_LANG, isLang, Lang } from './languages';

const STORAGE_KEY = 'care.lang';

/**
 * Nguồn sự thật duy nhất cho ngôn ngữ đang dùng. Đổi ngôn ngữ -> đồng bộ:
 * Transloco (chữ), ng-zorro (phân trang, bảng rỗng...), <html lang> (trình đọc màn hình), localStorage.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly transloco = inject(TranslocoService);
  private readonly nzI18n = inject(NzI18nService);
  private readonly document = inject(DOCUMENT);

  private readonly current = signal<Lang>(DEFAULT_LANG);
  readonly lang = this.current.asReadonly();

  /** Chạy trước khi app render: tải sẵn file dịch -> không nhấp nháy key thô. */
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

// localStorage có thể bị chặn (chế độ riêng tư) -> không để app lỗi vì nó.
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
    // bỏ qua
  }
}
