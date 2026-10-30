package com.careportal.api.auth;

import com.careportal.api.auth.TokenService.InvalidRefreshTokenException;
import com.careportal.api.auth.TokenService.TokenResponse;
import com.careportal.api.common.GlobalExceptionHandler;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
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
                // Cùng một thông báo cho "sai user" và "sai mật khẩu" -> không lộ user nào tồn tại.
                .orElseThrow(InvalidCredentialsException::new);
        return tokens.login(user);
    }

    /** Rotation: refresh token cũ bị vô hiệu, trả về cặp token mới. Xem TokenService.rotate. */
    @PostMapping("/refresh")
    public TokenResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return tokens.rotate(request.refreshToken());
    }

    /** Revoke refresh token ở server: token bị lộ sau khi đăng xuất cũng không dùng được nữa. */
    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@Valid @RequestBody RefreshRequest request) {
        tokens.revoke(request.refreshToken());
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    ProblemDetail handleInvalidCredentials() {
        return problems.problem(HttpStatus.UNAUTHORIZED, "auth.invalidCredentials");
    }

    @ExceptionHandler(InvalidRefreshTokenException.class)
    ProblemDetail handleInvalidRefreshToken() {
        return problems.problem(HttpStatus.UNAUTHORIZED, "auth.sessionExpired");
    }
}
