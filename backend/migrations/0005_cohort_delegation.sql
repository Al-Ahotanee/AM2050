ALTER TABLE cohorts
  ADD COLUMN delegated_user_id CHAR(26) NULL AFTER created_by,
  ADD COLUMN delegated_by CHAR(26) NULL AFTER delegated_user_id,
  ADD COLUMN delegated_at DATETIME NULL AFTER delegated_by,
  ADD CONSTRAINT fk_cohort_delegate FOREIGN KEY (delegated_user_id) REFERENCES users(id),
  ADD CONSTRAINT fk_cohort_delegator FOREIGN KEY (delegated_by) REFERENCES users(id),
  ADD INDEX idx_cohort_delegate (delegated_user_id);
