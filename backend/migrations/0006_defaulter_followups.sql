CREATE TABLE defaulter_followups (
  id CHAR(26) PRIMARY KEY,
  child_id CHAR(26) NOT NULL,
  outcome ENUM('contacted','home_visit','returned','referred','unreachable') NOT NULL,
  notes TEXT NULL,
  next_follow_up_date DATE NULL,
  followed_by CHAR(26) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (child_id) REFERENCES children(id),
  FOREIGN KEY (followed_by) REFERENCES users(id),
  INDEX idx_defaulter_followup_child (child_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
