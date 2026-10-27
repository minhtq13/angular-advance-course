package com.careportal.api.subscriber;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

final class SubscriberSpecs {

    private SubscriberSpecs() {
    }

    static Specification<Subscriber> matches(SubscriberSearch search) {
        return Specification.allOf(
                keyword(search.q()),
                search.status() == null ? null : (root, q, cb) -> cb.equal(root.get("status"), search.status()),
                search.type() == null ? null : (root, q, cb) -> cb.equal(root.get("type"), search.type()),
                !StringUtils.hasText(search.province()) ? null : (root, q, cb) -> cb.equal(root.get("province"), search.province()));
    }

    /** So dien thoai -> tim theo tien to; 12 chu so -> CCCD; con lai tim theo ten (ILIKE, cham tren bang lon - xem buoi 3). */
    private static Specification<Subscriber> keyword(String q) {
        if (!StringUtils.hasText(q)) {
            return null;
        }
        String keyword = q.trim();
        if (keyword.matches("\\d{12}")) {
            return (root, query, cb) -> cb.equal(root.get("idNumber"), keyword);
        }
        if (keyword.matches("0\\d{1,9}")) {
            return (root, query, cb) -> cb.like(root.get("msisdn"), keyword + "%");
        }
        return (root, query, cb) -> cb.like(cb.lower(root.get("fullName")), "%" + keyword.toLowerCase() + "%");
    }
}
