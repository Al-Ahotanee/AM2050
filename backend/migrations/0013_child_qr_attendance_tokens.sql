ALTER TABLE children ADD COLUMN attendance_qr_token CHAR(26) NULL AFTER child_unique_id;
UPDATE children SET attendance_qr_token = id WHERE attendance_qr_token IS NULL;
ALTER TABLE children MODIFY COLUMN attendance_qr_token CHAR(26) NOT NULL;
ALTER TABLE children ADD UNIQUE KEY uq_child_attendance_qr_token (attendance_qr_token);
