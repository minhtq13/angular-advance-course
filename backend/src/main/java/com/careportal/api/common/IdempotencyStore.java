package com.careportal.api.common;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;
import org.springframework.stereotype.Component;

/**
 * Idempotency cho lenh ghi (buoi 2): cung nguoi dung + cung Idempotency-Key -> tra lai ket qua lan dau, khong tao ban ghi moi.
 * Luu trong bo nho de de doc; production phai luu DB/Redis (nhieu instance, khoi dong lai khong mat).
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
        // Hai request trung key den cung luc: request sau doi request truoc xong roi nhan lai ket qua.
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
            // Action nem loi -> khong luu gi, client duoc thu lai voi cung key.
            T result = action.get();
            entries.put(id, new Entry(request, result, now.plus(TTL)));
            return new Outcome<>(result, false);
        }
    }
}
