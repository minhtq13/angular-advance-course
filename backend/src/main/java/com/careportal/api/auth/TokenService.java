package com.careportal.api.auth;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import javax.crypto.SecretKey;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtIssuerValidator;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TokenService {

    /** Claim phân biệt access token và refresh token: refresh token không dùng để gọi API được. */
    static final String TOKEN_USE = "token_use";
    static final String ACCESS = "access";
    static final String REFRESH = "refresh";
    static final Duration CLOCK_SKEW = Duration.ofSeconds(10);

    public record TokenResponse(String accessToken, String refreshToken, long expiresIn) {
    }

    /** Refresh token không hợp lệ, hết hạn, đã revoke hoặc đã bị dùng lại -> 401, phải đăng nhập lại. */
    public static class InvalidRefreshTokenException extends RuntimeException {
    }

    private final JwtEncoder encoder;
    private final SecretKey key;
    private final AuthProperties props;
    private final AppUserRepository users;
    private final RefreshTokenRepository refreshTokens;

    /** Đăng nhập thành công: mở một refresh token family mới. */
    @Transactional
    public TokenResponse login(AppUser user) {
        return issue(user, UUID.randomUUID());
    }

    /**
     * Đổi refresh token lấy cặp token mới (rotation). Mỗi refresh token chỉ dùng được MỘT lần.
     * Gửi lại token đã dùng -> coi như bị lộ (kẻ tấn công và người dùng thật cùng giữ nó) -> revoke cả family,
     * cả hai bên phải đăng nhập lại.
     * noRollbackFor: việc revoke phải được lưu dù sau đó ném lỗi 401.
     */
    @Transactional(noRollbackFor = InvalidRefreshTokenException.class)
    public TokenResponse rotate(String refreshToken) {
        var stored = refreshTokens.findById(jtiOf(refreshToken)).orElseThrow(InvalidRefreshTokenException::new);
        Instant now = Instant.now();
        if (refreshTokens.markUsed(stored.getJti(), now) == 0) {
            if (refreshTokens.revokeFamily(stored.getFamilyId(), now) > 0) {
                log.warn("Refresh token {} cua {} bi dung lai -> thu hoi ho {}",
                        stored.getJti(), stored.getUsername(), stored.getFamilyId());
            }
            throw new InvalidRefreshTokenException();
        }
        // Đọc lại user: tài khoản bị khóa / đổi role sẽ có hiệu lực ở lần refresh tiếp theo.
        var user = users.findById(stored.getUsername()).filter(AppUser::isEnabled)
                .orElseThrow(InvalidRefreshTokenException::new);
        return issue(user, stored.getFamilyId());
    }

    /** Đăng xuất: revoke cả family của refresh token này. Token sai/hết hạn -> bỏ qua (đăng xuất luôn thành công). */
    @Transactional
    public void revoke(String refreshToken) {
        try {
            refreshTokens.findById(jtiOf(refreshToken))
                    .ifPresent(t -> refreshTokens.revokeFamily(t.getFamilyId(), Instant.now()));
        } catch (InvalidRefreshTokenException ex) {
            // bỏ qua
        }
    }

    private TokenResponse issue(AppUser user, UUID familyId) {
        Instant now = Instant.now();
        String access = encode(JwtClaimsSet.builder()
                .issuer(JwtConfig.ISSUER)
                .audience(List.of(JwtConfig.AUDIENCE))
                .subject(user.getUsername())
                .issuedAt(now)
                .expiresAt(now.plus(props.accessTokenTtl()))
                .claim(TOKEN_USE, ACCESS)
                .claim("preferred_username", user.getUsername())
                .claim("name", user.getFullName())
                .claim("email", user.getEmail())
                .claim("roles", user.roleList())
                .build());
        UUID jti = UUID.randomUUID();
        Instant refreshExpiresAt = now.plus(props.refreshTokenTtl());
        refreshTokens.save(new RefreshToken(jti, familyId, user.getUsername(), now, refreshExpiresAt));
        String refresh = encode(JwtClaimsSet.builder()
                .id(jti.toString())
                .issuer(JwtConfig.ISSUER)
                .audience(List.of(JwtConfig.AUDIENCE))
                .subject(user.getUsername())
                .issuedAt(now)
                .expiresAt(refreshExpiresAt)
                .claim(TOKEN_USE, REFRESH)
                .build());
        return new TokenResponse(access, refresh, props.accessTokenTtl().toSeconds());
    }

    /** Kiểm tra signature, hạn, iss, aud, token_use rồi lấy jti. */
    private UUID jtiOf(String refreshToken) {
        try {
            return UUID.fromString(decoder(key, REFRESH).decode(refreshToken).getId());
        } catch (JwtException | IllegalArgumentException | NullPointerException ex) {
            throw new InvalidRefreshTokenException();
        }
    }

    private String encode(JwtClaimsSet claims) {
        var header = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    static JwtDecoder decoder(SecretKey key, String expectedUse) {
        NimbusJwtDecoder decoder = JwtConfig.baseDecoder(key);
        OAuth2TokenValidator<Jwt> tokenUse = jwt -> expectedUse.equals(jwt.getClaimAsString(TOKEN_USE))
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Sai loai token", null));
        OAuth2TokenValidator<Jwt> audience = new JwtClaimValidator<List<String>>(JwtClaimNames.AUD,
                aud -> aud != null && aud.contains(JwtConfig.AUDIENCE));
        // Mặc định Spring cho clock skew 60 giây (token hết hạn vẫn dùng được thêm 1 phút). Giảm xuống 10 giây.
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                new JwtTimestampValidator(CLOCK_SKEW), new JwtIssuerValidator(JwtConfig.ISSUER), audience, tokenUse));
        return decoder;
    }

}
