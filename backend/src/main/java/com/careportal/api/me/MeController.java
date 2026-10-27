package com.careportal.api.me;

import java.util.List;
import java.util.Set;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MeController {

    private static final Set<String> APP_ROLES = Set.of("AGENT", "SUPERVISOR", "ADMIN");

    public record MeDto(String username, String fullName, String email, List<String> roles) {
    }

    @GetMapping("/api/me")
    public MeDto me(@AuthenticationPrincipal Jwt jwt, JwtAuthenticationToken auth) {
        var roles = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring(5))
                .filter(APP_ROLES::contains)
                .toList();
        return new MeDto(auth.getName(), jwt.getClaimAsString("name"), jwt.getClaimAsString("email"), roles);
    }
}
