CREATE TABLE service_plan (
    code        VARCHAR(20) PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    type        VARCHAR(20)  NOT NULL,
    monthly_fee NUMERIC(12, 0) NOT NULL,
    data_gb     INT NOT NULL,
    active      BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE subscriber (
    id            BIGSERIAL PRIMARY KEY,
    msisdn        VARCHAR(15)  NOT NULL UNIQUE,
    full_name     VARCHAR(150) NOT NULL,
    id_number     VARCHAR(12)  NOT NULL,
    date_of_birth DATE         NOT NULL,
    province      VARCHAR(50)  NOT NULL,
    type          VARCHAR(20)  NOT NULL,
    status        VARCHAR(20)  NOT NULL,
    plan_code     VARCHAR(20)  NOT NULL REFERENCES service_plan (code),
    activated_at  TIMESTAMPTZ  NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    version       BIGINT       NOT NULL DEFAULT 0
);

CREATE INDEX idx_subscriber_status ON subscriber (status);
CREATE INDEX idx_subscriber_province ON subscriber (province);
CREATE INDEX idx_subscriber_id_number ON subscriber (id_number);

CREATE TABLE ticket (
    id            BIGSERIAL PRIMARY KEY,
    code          VARCHAR(20)  NOT NULL UNIQUE,
    subscriber_id BIGINT       NOT NULL REFERENCES subscriber (id),
    category      VARCHAR(20)  NOT NULL,
    priority      VARCHAR(20)  NOT NULL,
    status        VARCHAR(20)  NOT NULL,
    title         VARCHAR(200) NOT NULL,
    description   TEXT,
    assignee      VARCHAR(100),
    created_by    VARCHAR(100) NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    version       BIGINT       NOT NULL DEFAULT 0
);

CREATE SEQUENCE ticket_code_seq;
CREATE INDEX idx_ticket_subscriber ON ticket (subscriber_id);
CREATE INDEX idx_ticket_status_priority ON ticket (status, priority);
