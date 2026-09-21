ALTER TABLE cohorts
  ADD COLUMN owner_scope_type ENUM('state','lga','ward','school','class') NULL AFTER status,
  ADD COLUMN owner_scope_id CHAR(26) NULL AFTER owner_scope_type,
  ADD COLUMN created_by CHAR(26) NULL AFTER owner_scope_id,
  ADD COLUMN closed_at DATETIME NULL AFTER created_by,
  ADD COLUMN closed_by CHAR(26) NULL AFTER closed_at,
  ADD CONSTRAINT fk_cohort_creator FOREIGN KEY (created_by) REFERENCES users(id),
  ADD CONSTRAINT fk_cohort_closer FOREIGN KEY (closed_by) REFERENCES users(id),
  ADD INDEX idx_cohort_owner (owner_scope_type, owner_scope_id);

ALTER TABLE cohort_members
  ADD COLUMN removed_at DATETIME NULL AFTER added_at,
  ADD COLUMN removed_by CHAR(26) NULL AFTER removed_at,
  ADD CONSTRAINT fk_cm_remover FOREIGN KEY (removed_by) REFERENCES users(id);

CREATE TABLE report_schedules (
  id CHAR(26) PRIMARY KEY,
  report_type ENUM('attendance_alerts','results_summary','incentive_disbursements') NOT NULL,
  frequency ENUM('weekly','monthly') NOT NULL,
  delivery_email VARCHAR(200) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by CHAR(26) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_report_schedule_creator FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_report_schedule_active (is_active, frequency)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
