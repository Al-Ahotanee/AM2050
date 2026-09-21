ALTER TABLE subjects ADD COLUMN school_id CHAR(26) NULL AFTER subject_code;
ALTER TABLE subjects ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE AFTER school_id;
ALTER TABLE subjects ADD CONSTRAINT fk_subject_school FOREIGN KEY (school_id) REFERENCES schools(id);
CREATE INDEX idx_subject_school ON subjects (school_id, is_active);

CREATE TABLE IF NOT EXISTS teaching_allocations (
  id CHAR(26) PRIMARY KEY,
  class_id CHAR(26) NOT NULL,
  subject_id CHAR(26) NOT NULL,
  teacher_id CHAR(26) NOT NULL,
  assigned_by CHAR(26) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ta_class FOREIGN KEY (class_id) REFERENCES school_classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_ta_subject FOREIGN KEY (subject_id) REFERENCES subjects(id),
  CONSTRAINT fk_ta_teacher FOREIGN KEY (teacher_id) REFERENCES users(id),
  CONSTRAINT fk_ta_assigner FOREIGN KEY (assigned_by) REFERENCES users(id),
  UNIQUE KEY uq_teaching_allocation (class_id, subject_id),
  INDEX idx_ta_teacher (teacher_id, is_active),
  INDEX idx_ta_class (class_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
