package com.careportal.api.auth;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Một refresh token đã phát. Chỉ lưu jti (id của token), không lưu chuỗi token. */
@Entity
@Table(name = "refresh_token")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RefreshToken {

    @Id
    private UUID jti;
    private UUID familyId;
    private String username;
    private Instant issuedAt;
    private Instant expiresAt;
    private Instant usedAt;
    private Instant revokedAt;

    RefreshToken(UUID jti, UUID familyId, String username, Instant issuedAt, Instant expiresAt) {
        this.jti = jti;
        this.familyId = familyId;
        this.username = username;
        this.issuedAt = issuedAt;
        this.expiresAt = expiresAt;
    }
}
