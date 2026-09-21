CREATE TABLE teacher_registration_requests (
  id CHAR(26) PRIMARY KEY,
  requested_name VARCHAR(200) NOT NULL,
  requested_phone VARCHAR(20) NOT NULL,
  requested_email VARCHAR(200) NULL,
  school_id CHAR(26) NOT NULL,
  requested_by CHAR(26) NOT NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  reviewed_by CHAR(26) NULL,
  reviewed_at DATETIME NULL,
  created_user_id CHAR(26) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id),
  FOREIGN KEY (requested_by) REFERENCES users(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id),
  FOREIGN KEY (created_user_id) REFERENCES users(id),
  INDEX idx_teacher_request_status (status, school_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
