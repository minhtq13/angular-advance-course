package com.careportal.api.auth;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @param mode           local = backend tu phat JWT; keycloak = tin JWT do Keycloak phat
 * @param jwtSecret      khoa HMAC ky JWT (che do local), toi thieu 32 byte
 * @param accessTokenTtl thoi han access token
 * @param refreshTokenTtl thoi han refresh token
 */
@ConfigurationProperties("care.auth")
public record AuthProperties(String mode, String jwtSecret, Duration accessTokenTtl, Duration refreshTokenTtl) {
}
