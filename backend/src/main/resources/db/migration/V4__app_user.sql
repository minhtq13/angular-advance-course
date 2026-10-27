-- Tai khoan dang nhap cho che do care.auth.mode=local (backend tu phat JWT).
-- Mat khau = ten dang nhap, bam bang bcrypt (pgcrypto) - KHONG bao gio luu mat khau dang ro.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE app_user (
    username      VARCHAR(50)  PRIMARY KEY,
    password_hash VARCHAR(100) NOT NULL,
    full_name     VARCHAR(150) NOT NULL,
    email         VARCHAR(150),
    roles         VARCHAR(100) NOT NULL,
    enabled       BOOLEAN      NOT NULL DEFAULT TRUE
);

INSERT INTO app_user (username, password_hash, full_name, email, roles) VALUES
    ('agent1',      crypt('agent1',      gen_salt('bf', 10)), 'Agent One',      'agent1@care.local',      'AGENT'),
    ('supervisor1', crypt('supervisor1', gen_salt('bf', 10)), 'Supervisor One', 'supervisor1@care.local', 'AGENT,SUPERVISOR'),
    ('admin1',      crypt('admin1',      gen_salt('bf', 10)), 'Admin One',      'admin1@care.local',      'AGENT,SUPERVISOR,ADMIN');
