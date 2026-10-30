package com.careportal.api.auth;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @param jwtSecret      signing key HMAC cho JWT, tối thiểu 32 byte
 * @param accessTokenTtl thời hạn access token
 * @param refreshTokenTtl thời hạn refresh token
 */
@ConfigurationProperties("care.auth")
public record AuthProperties(String jwtSecret, Duration accessTokenTtl, Duration refreshTokenTtl) {
}
