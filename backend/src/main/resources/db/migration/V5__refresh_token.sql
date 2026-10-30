-- Buổi 6: refresh token rotation có trạng thái.
-- Mỗi lần đăng nhập mở một token family mới (family_id). Mỗi lần refresh: đánh dấu token cũ đã dùng, phát token mới cùng family.
-- Token đã dùng mà bị gửi lại -> có thể đã bị lộ -> revoke cả family (kể cả token mới nhất).
CREATE TABLE refresh_token (
    jti        UUID         PRIMARY KEY,
    family_id  UUID         NOT NULL,
    username   VARCHAR(50)  NOT NULL REFERENCES app_user (username),
    issued_at  TIMESTAMPTZ  NOT NULL,
    expires_at TIMESTAMPTZ  NOT NULL,
    used_at    TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_refresh_token_family ON refresh_token (family_id);
