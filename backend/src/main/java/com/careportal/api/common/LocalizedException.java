package com.careportal.api.common;

/**
 * Loi nghiep vu mang ma thong bao (key trong messages*.properties) + tham so, KHONG mang cau chu co dinh.
 * GlobalExceptionHandler dich ra ngon ngu cua request (header Accept-Language).
 */
public abstract class LocalizedException extends RuntimeException {

    private final String messageKey;
    private final transient Object[] args;

    protected LocalizedException(String messageKey, Object... args) {
        super(messageKey);
        this.messageKey = messageKey;
        this.args = args;
    }

    public String getMessageKey() {
        return messageKey;
    }

    public Object[] getArgs() {
        return args;
    }

    /** Tham so cung can dich truoc khi ghep vao cau (vd ten tai nguyen, gia tri enum). */
    public record Translatable(String key) {
    }
}
