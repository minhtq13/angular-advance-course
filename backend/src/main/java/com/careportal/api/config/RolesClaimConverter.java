package com.careportal.api.config;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Doc role tu JWT va doi thanh ROLE_xxx cho Spring Security.
 * Che do local: claim "roles". Che do keycloak: claim "realm_access.roles".
 */
public class RolesClaimConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        List<?> roles = jwt.getClaimAsStringList("roles");
        if (roles == null) {
            Map<String, Object> realmAccess = jwt.getClaimAsMap("realm_access");
            roles = realmAccess != null && realmAccess.get("roles") instanceof List<?> list ? list : List.of();
        }
        return roles.stream()
                .map(Object::toString)
                .map(role -> (GrantedAuthority) new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
                .toList();
    }
}
