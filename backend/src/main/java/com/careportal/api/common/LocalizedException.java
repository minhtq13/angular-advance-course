package com.careportal.api.common;

/**
 * Lỗi nghiệp vụ mang mã thông báo (key trong messages*.properties) + tham số, KHÔNG mang câu chữ cố định.
 * GlobalExceptionHandler dịch ra ngôn ngữ của request (header Accept-Language).
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

    /** Tham số cũng cần dịch trước khi ghép vào câu (vd tên resource, giá trị enum). */
    public record Translatable(String key) {
    }
}
