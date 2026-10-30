import type { DateFormatOptions } from '@jsverse/transloco-locale';

export const LANGUAGES = ['vi', 'en'] as const;
export type Lang = (typeof LANGUAGES)[number];
export const DEFAULT_LANG: Lang = 'vi';

/** Mã locale cho Intl (định dạng số, ngày, tiền) theo từng ngôn ngữ. */
export const LOCALE_OF: Record<Lang, string> = { vi: 'vi-VN', en: 'en-US' };

export function isLang(value: unknown): value is Lang {
  return (
    typeof value === 'string' &&
    (LANGUAGES as readonly string[]).includes(value)
  );
}

/** Định dạng ngày/giờ dùng chung, để vi và en tự xếp thứ tự ngày-tháng theo thói quen mỗi nước. */
export const DATE_FORMAT: DateFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
};
/**
 * Giờ định dạng RIÊNG rồi đặt sau ngày: Intl vi-VN ghép "09:58 25/10/2026" (giờ trước),
 * trong khi người dùng quen đọc "25/10/2026 09:58".
 */
export const TIME_FORMAT: DateFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
};
