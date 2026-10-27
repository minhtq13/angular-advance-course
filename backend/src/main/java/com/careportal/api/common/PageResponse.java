package com.careportal.api.common;

import java.util.List;
import org.springframework.data.domain.Page;

/** Dinh dang phan trang on dinh cho FE, khong phu thuoc cau truc JSON noi bo cua Spring Data. */
public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages) {

    public static <T> PageResponse<T> of(Page<T> page) {
        return new PageResponse<>(page.getContent(), page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }
}
