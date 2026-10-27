package com.careportal.api.auth;

import java.time.Instant;
import javax.crypto.SecretKey;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "care.auth", name = "mode", havingValue = "local", matchIfMissing = true)
public class TokenService {

    /** Claim phan biet access token va refresh token: refresh token khong dung de goi API duoc. */
    static final String TOKEN_USE = "token_use";
    static final String ACCESS = "access";
    static final String REFRESH = "refresh";

    public record TokenResponse(String accessToken, String refreshToken, long expiresIn) {
    }

    private final JwtEncoder encoder;
    private final SecretKey key;
    private final AuthProperties props;

    public TokenResponse issue(AppUser user) {
        Instant now = Instant.now();
        String access = encode(JwtClaimsSet.builder()
                .issuer(LocalAuthConfig.ISSUER)
                .subject(user.getUsername())
                .issuedAt(now)
                .expiresAt(now.plus(props.accessTokenTtl()))
                .claim(TOKEN_USE, ACCESS)
                .claim("preferred_username", user.getUsername())
                .claim("name", user.getFullName())
                .claim("email", user.getEmail())
                .claim("roles", user.roleList())
                .build());
        String refresh = encode(JwtClaimsSet.builder()
                .issuer(LocalAuthConfig.ISSUER)
                .subject(user.getUsername())
                .issuedAt(now)
                .expiresAt(now.plus(props.refreshTokenTtl()))
                .claim(TOKEN_USE, REFRESH)
                .build());
        return new TokenResponse(access, refresh, props.accessTokenTtl().toSeconds());
    }

    /** Tra ve username neu refresh token hop le; nem JwtException neu khong. */
    public String verifyRefreshToken(String token) {
        return decoder(key, REFRESH).decode(token).getSubject();
    }

    private String encode(JwtClaimsSet claims) {
        var header = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    static JwtDecoder decoder(SecretKey key, String expectedUse) {
        NimbusJwtDecoder decoder = LocalAuthConfig.baseDecoder(key);
        OAuth2TokenValidator<Jwt> tokenUse = jwt -> expectedUse.equals(jwt.getClaimAsString(TOKEN_USE))
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Sai loai token", null));
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(LocalAuthConfig.ISSUER), tokenUse));
        return decoder;
    }

}
