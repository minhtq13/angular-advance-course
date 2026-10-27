package com.careportal.api.auth;

import com.careportal.api.auth.TokenService.TokenResponse;
import com.careportal.api.common.GlobalExceptionHandler;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "care.auth", name = "mode", havingValue = "local", matchIfMissing = true)
public class AuthController {

    public record LoginRequest(@NotBlank String username, @NotBlank String password) {
    }

    public record RefreshRequest(@NotBlank String refreshToken) {
    }

    static class InvalidCredentialsException extends RuntimeException {
    }

    private final AppUserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokens;
    private final GlobalExceptionHandler problems;

    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody LoginRequest request) {
        var user = users.findById(request.username())
                .filter(AppUser::isEnabled)
                .filter(u -> passwordEncoder.matches(request.password(), u.getPasswordHash()))
                // Cung mot thong bao cho "sai user" va "sai mat khau" -> khong lo user nao ton tai.
                .orElseThrow(InvalidCredentialsException::new);
        return tokens.issue(user);
    }

    @PostMapping("/refresh")
    public TokenResponse refresh(@Valid @RequestBody RefreshRequest request) {
        String username;
        try {
            username = tokens.verifyRefreshToken(request.refreshToken());
        } catch (JwtException ex) {
            throw new InvalidCredentialsException();
        }
        // Doc lai user: tai khoan bi khoa / doi role se co hieu luc o lan refresh tiep theo.
        var user = users.findById(username).filter(AppUser::isEnabled).orElseThrow(InvalidCredentialsException::new);
        return tokens.issue(user);
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    ProblemDetail handleInvalidCredentials() {
        return problems.problem(HttpStatus.UNAUTHORIZED, "auth.invalidCredentials");
    }
}
