package com.careportal.api.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Máy chủ định danh OIDC bên ngoài (buổi 7: Keycloak). Để trống issuerUri -> API chỉ nhận token tự phát.
 *
 * @param issuerUri giá trị "iss" trong token, đúng URL trình duyệt thấy (vd http://localhost:8180/realms/care)
 * @param jwkSetUri nơi lấy public key để kiểm tra signature; trong docker là địa chỉ nội bộ, có thể khác issuerUri
 */
@ConfigurationProperties("care.sso")
public record SsoProperties(String issuerUri, String jwkSetUri) {

    public boolean enabled() {
        return issuerUri != null && !issuerUri.isBlank() && jwkSetUri != null && !jwkSetUri.isBlank();
    }
}
