ALTER TABLE teacher_registration_requests
  ADD COLUMN requested_staff_number VARCHAR(64) NULL AFTER requested_email,
  ADD COLUMN requested_date_of_birth DATE NULL AFTER requested_staff_number,
  ADD COLUMN requested_photo_data MEDIUMTEXT NULL AFTER requested_date_of_birth,
  ADD COLUMN requested_highest_qualification VARCHAR(255) NULL AFTER requested_photo_data,
  ADD COLUMN requested_rank_title VARCHAR(160) NULL AFTER requested_highest_qualification,
  ADD COLUMN requested_specialization VARCHAR(255) NULL AFTER requested_rank_title,
  ADD COLUMN requested_subjects_taught JSON NULL AFTER requested_specialization,
  ADD COLUMN requested_password_hash VARCHAR(255) NULL AFTER requested_subjects_taught,
  ADD INDEX idx_teacher_request_staff_number (requested_staff_number);

ALTER TABLE users
  ADD COLUMN staff_number VARCHAR(64) NULL AFTER email,
  ADD COLUMN date_of_birth DATE NULL AFTER staff_number,
  ADD COLUMN photo_data MEDIUMTEXT NULL AFTER date_of_birth,
  ADD COLUMN highest_qualification VARCHAR(255) NULL AFTER photo_data,
  ADD COLUMN rank_title VARCHAR(160) NULL AFTER highest_qualification,
  ADD COLUMN specialization VARCHAR(255) NULL AFTER rank_title,
  ADD COLUMN subjects_taught JSON NULL AFTER specialization,
  ADD UNIQUE KEY uq_users_staff_number (staff_number);
