package com.careportal.api.auth;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @param jwtSecret      khoa HMAC ky JWT, toi thieu 32 byte
 * @param accessTokenTtl thoi han access token
 * @param refreshTokenTtl thoi han refresh token
 */
@ConfigurationProperties("care.auth")
public record AuthProperties(String jwtSecret, Duration accessTokenTtl, Duration refreshTokenTtl) {
}
