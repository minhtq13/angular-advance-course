package com.careportal.api.auth;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

/** Backend tự ký và tự kiểm tra JWT (HMAC SHA-256); không phụ thuộc máy chủ định danh bên ngoài. */
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

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    static NimbusJwtDecoder baseDecoder(SecretKey key) {
        return NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
    }
}
