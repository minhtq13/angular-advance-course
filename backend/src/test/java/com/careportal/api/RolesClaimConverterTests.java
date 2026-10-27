package com.careportal.api;

import static org.assertj.core.api.Assertions.assertThat;

import com.careportal.api.config.RolesClaimConverter;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

class RolesClaimConverterTests {

    private final RolesClaimConverter converter = new RolesClaimConverter();

    private Jwt jwt(java.util.Map<String, Object> claims) {
        return new Jwt("token", Instant.now(), Instant.now().plusSeconds(60), java.util.Map.of("alg", "HS256"), claims);
    }

    @Test
    void mapsRolesClaimToSpringAuthorities() {
        var authorities = converter.convert(jwt(java.util.Map.of("roles", List.of("AGENT", "supervisor"))));

        assertThat(authorities).extracting(GrantedAuthority::getAuthority).containsExactly("ROLE_AGENT", "ROLE_SUPERVISOR");
    }

    @Test
    void tokenWithoutRolesGetsNoAuthority() {
        assertThat(converter.convert(jwt(java.util.Map.of("sub", "x")))).isEmpty();
    }
}
