package com.careportal.api.common;

public class NotFoundException extends LocalizedException {

    /** @param resourceKey key ten tai nguyen, vd "resource.subscriber" (cung duoc dich). */
    public NotFoundException(String resourceKey, Object id) {
        // String.valueOf: MessageFormat se dinh dang so thanh "999,999,999" - sai voi ma dinh danh.
        super("error.notFound", new Translatable(resourceKey), String.valueOf(id));
    }
}
