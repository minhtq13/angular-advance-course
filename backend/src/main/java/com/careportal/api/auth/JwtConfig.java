package com.careportal.api.auth;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationManagerResolver;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtIssuerValidator;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationProvider;
import org.springframework.security.oauth2.server.resource.authentication.JwtIssuerAuthenticationManagerResolver;

/**
 * Backend tự ký và tự kiểm tra JWT (HMAC SHA-256); không phụ thuộc máy chủ định danh bên ngoài.
 * Buổi 7: nhận thêm access token của Keycloak (RS256, kiểm tra bằng JWKS) khi cấu hình care.sso.
 */
@Configuration
public class JwtConfig {

    static final String ISSUER = "care-api";
    /** Token chỉ dành cho API này: API khác (cùng key) phải từ chối, và ngược lại. */
    static final String AUDIENCE = "care-api";

    @Bean
    SecretKey jwtSecretKey(AuthProperties props) {
        byte[] bytes = props.jwtSecret().getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("care.auth.jwt-secret phai dai toi thieu 32 byte");
        }
        return new SecretKeySpec(bytes, "HmacSHA256");
    }

    @Bean
    JwtEncoder jwtEncoder(SecretKey key) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(key));
    }

    /** Decoder cho API: chỉ chấp nhận access token. */
    @Bean
    JwtDecoder jwtDecoder(SecretKey key) {
        return TokenService.decoder(key, TokenService.ACCESS);
    }

    /**
     * Chọn decoder theo claim "iss": token tự phát (care-api) hay token Keycloak.
     * Issuer lạ -> 401 ngay, không tải key từ địa chỉ do token tự khai.
     */
    @Bean
    AuthenticationManagerResolver<HttpServletRequest> jwtAuthenticationManagerResolver(
            JwtDecoder jwtDecoder, SsoProperties sso, JwtAuthenticationConverter converter) {
        Map<String, AuthenticationManager> managers = new HashMap<>();
        managers.put(ISSUER, manager(jwtDecoder, converter));
        if (sso.enabled()) {
            managers.put(sso.issuerUri(), manager(ssoDecoder(sso), converter));
        }
        return new JwtIssuerAuthenticationManagerResolver(managers::get);
    }

    /** Access token Keycloak: signature (JWKS), hạn, iss và aud phải có care-api. ID token (aud = client) bị từ chối. */
    static JwtDecoder ssoDecoder(SsoProperties sso) {
        var decoder = NimbusJwtDecoder.withJwkSetUri(sso.jwkSetUri()).build();
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                new JwtTimestampValidator(TokenService.CLOCK_SKEW),
                new JwtIssuerValidator(sso.issuerUri()),
                new JwtClaimValidator<List<String>>(JwtClaimNames.AUD, aud -> aud != null && aud.contains(AUDIENCE))));
        return decoder;
    }

    private static AuthenticationManager manager(JwtDecoder decoder, JwtAuthenticationConverter converter) {
        var provider = new JwtAuthenticationProvider(decoder);
        provider.setJwtAuthenticationConverter(converter);
        return provider::authenticate;
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    static NimbusJwtDecoder baseDecoder(SecretKey key) {
        return NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
    }
}
