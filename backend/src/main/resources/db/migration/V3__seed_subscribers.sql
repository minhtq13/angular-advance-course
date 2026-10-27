-- Sinh du lieu gia lap bang generate_series. So luong dieu khien qua placeholder seed_subscribers / seed_tickets.
INSERT INTO subscriber (msisdn, full_name, id_number, date_of_birth, province, type, status, plan_code, activated_at, created_at, updated_at)
SELECT
    '09' || lpad(g::TEXT, 8, '0'),
    (ARRAY['Nguyễn','Trần','Lê','Phạm','Hoàng','Huỳnh','Phan','Vũ','Võ','Đặng','Bùi','Đỗ','Hồ','Ngô','Dương','Lý'])[1 + g % 16] || ' ' ||
    (ARRAY['Văn','Thị','Đức','Minh','Ngọc','Thanh','Quang','Thu','Hữu','Kim'])[1 + (g / 16) % 10] || ' ' ||
    (ARRAY['An','Bình','Chi','Dũng','Giang','Hà','Hiếu','Hoa','Hùng','Khánh','Lan','Linh','Long','Mai','Nam','Phương','Quân','Sơn','Tâm','Trang','Tuấn','Vy'])[1 + (g / 7) % 22],
    '0' || lpad(((g::BIGINT * 7919) % 100000000000)::TEXT, 11, '0'),
    DATE '1960-01-01' + ((g * 37) % 16000),
    (ARRAY['Hà Nội','TP Hồ Chí Minh','Đà Nẵng','Hải Phòng','Cần Thơ','Huế','Nghệ An','Thanh Hóa','Quảng Ninh','Khánh Hòa','Đồng Nai','Lâm Đồng','Bắc Ninh','An Giang','Gia Lai','Đắk Lắk'])[1 + (g / 3) % 16],
    CASE WHEN g % 5 = 0 THEN 'POSTPAID' ELSE 'PREPAID' END,
    CASE WHEN g % 50 = 0 THEN 'TERMINATED' WHEN g % 17 = 0 THEN 'SUSPENDED' ELSE 'ACTIVE' END,
    CASE WHEN g % 5 = 0 THEN (ARRAY['PT199','PT299','PT499','BIZ99'])[1 + (g / 5) % 4]
         ELSE (ARRAY['D15','D70','D120','VD149'])[1 + g % 4] END,
    now() - ((g % 3650) || ' days')::INTERVAL,
    now() - ((g % 3650) || ' days')::INTERVAL,
    now()
FROM generate_series(1, ${seed_subscribers}) AS g;

INSERT INTO ticket (code, subscriber_id, category, priority, status, title, description, assignee, created_by, created_at, updated_at)
SELECT
    'TK-' || lpad(nextval('ticket_code_seq')::TEXT, 7, '0'),
    1 + (g::BIGINT * 104729) % ${seed_subscribers},
    (ARRAY['BILLING','NETWORK','SERVICE','OTHER'])[1 + g % 4],
    (ARRAY['LOW','MEDIUM','MEDIUM','HIGH','URGENT'])[1 + g % 5],
    (ARRAY['NEW','IN_PROGRESS','RESOLVED','CLOSED'])[1 + (g / 3) % 4],
    (ARRAY['Không vào được mạng 4G','Cước phí bất thường','Yêu cầu đổi gói cước','Sóng yếu tại nhà','Không nhận được OTP'])[1 + g % 5],
    'Khách hàng phản ánh qua tổng đài.',
    CASE WHEN g % 3 = 0 THEN NULL ELSE 'agent1' END,
    'agent1',
    now() - ((g % 365) || ' days')::INTERVAL,
    now() - ((g % 30) || ' days')::INTERVAL
FROM generate_series(1, ${seed_tickets}) AS g;
