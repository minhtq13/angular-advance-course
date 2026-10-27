package com.careportal.api.common;

public class ConflictException extends LocalizedException {

    public ConflictException(String messageKey, Object... args) {
        super(messageKey, args);
    }
}
