package com.careportal.api.auth;

import java.time.Instant;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    /**
     * Đánh dấu đã dùng bằng MỘT câu UPDATE có điều kiện: hai request refresh cùng lúc với cùng token
     * thì Postgres lock dòng, chỉ một câu trả về 1, câu còn lại trả về 0. Không "đọc rồi ghi" (race).
     */
    @Modifying
    @Query("""
            update RefreshToken t set t.usedAt = :now
            where t.jti = :jti and t.usedAt is null and t.revokedAt is null and t.expiresAt > :now
            """)
    int markUsed(@Param("jti") UUID jti, @Param("now") Instant now);

    @Modifying
    @Query("update RefreshToken t set t.revokedAt = :now where t.familyId = :familyId and t.revokedAt is null")
    int revokeFamily(@Param("familyId") UUID familyId, @Param("now") Instant now);
}
