import type { DateFormatOptions } from '@jsverse/transloco-locale';

export const LANGUAGES = ['vi', 'en'] as const;
export type Lang = (typeof LANGUAGES)[number];
export const DEFAULT_LANG: Lang = 'vi';

/** Ma locale cho Intl (dinh dang so, ngay, tien) theo tung ngon ngu. */
export const LOCALE_OF: Record<Lang, string> = { vi: 'vi-VN', en: 'en-US' };

export function isLang(value: unknown): value is Lang {
  return (
    typeof value === 'string' &&
    (LANGUAGES as readonly string[]).includes(value)
  );
}

/** Dinh dang ngay/gio dung chung, de vi va en tu xep thu tu ngay-thang theo thoi quen moi nuoc. */
export const DATE_FORMAT: DateFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
};
/**
 * Gio dinh dang RIENG roi dat sau ngay: Intl vi-VN ghep "09:58 25/10/2026" (gio truoc),
 * trong khi nguoi dung quen doc "25/10/2026 09:58".
 */
export const TIME_FORMAT: DateFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
};
