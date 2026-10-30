package com.careportal.api.common;

public class NotFoundException extends LocalizedException {

    /** @param resourceKey key tên resource, vd "resource.subscriber" (cũng được dịch). */
    public NotFoundException(String resourceKey, Object id) {
        // String.valueOf: MessageFormat sẽ định dạng số thành "999,999,999" - sai với mã định danh.
        super("error.notFound", new Translatable(resourceKey), String.valueOf(id));
    }
}
