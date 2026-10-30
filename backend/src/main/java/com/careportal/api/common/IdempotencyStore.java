package com.careportal.api.common;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;
import org.springframework.stereotype.Component;

/**
 * Idempotency cho lệnh ghi (buổi 2): cùng người dùng + cùng Idempotency-Key -> trả lại kết quả lần đầu, không tạo bản ghi mới.
 * Lưu trong bộ nhớ để dễ đọc; production phải lưu DB/Redis (nhiều instance, khởi động lại không mất).
 */
@Component
public class IdempotencyStore {

    private static final Duration TTL = Duration.ofHours(24);

    private record Entry(Object request, Object result, Instant expiresAt) {
    }

    public record Outcome<T>(T result, boolean replayed) {
    }

    private final Map<String, Entry> entries = new ConcurrentHashMap<>();
    private final Map<String, Object> locks = new ConcurrentHashMap<>();

    @SuppressWarnings("unchecked")
    public <T> Outcome<T> execute(String scope, String key, Object request, Supplier<T> action) {
        String id = scope + ":" + key;
        // Hai request trùng key đến cùng lúc: request sau đợi request trước xong rồi nhận lại kết quả.
        synchronized (locks.computeIfAbsent(id, k -> new Object())) {
            Instant now = Instant.now();
            entries.values().removeIf(e -> e.expiresAt().isBefore(now));
            Entry existing = entries.get(id);
            if (existing != null) {
                if (!existing.request().equals(request)) {
                    throw new ConflictException("error.idempotencyKeyReused");
                }
                return new Outcome<>((T) existing.result(), true);
            }
            // Action ném lỗi -> không lưu gì, client được thử lại với cùng key.
            T result = action.get();
            entries.put(id, new Entry(request, result, now.plus(TTL)));
            return new Outcome<>(result, false);
        }
    }
}
