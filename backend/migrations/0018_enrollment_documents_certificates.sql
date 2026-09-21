ALTER TABLE schools ADD COLUMN school_logo MEDIUMTEXT NULL AFTER school_name;

ALTER TABLE enrollments
  ADD COLUMN approved_at DATETIME NULL AFTER approved_by,
  ADD COLUMN transition_reason TEXT NULL AFTER approved_at,
  ADD COLUMN transition_effective_date DATE NULL AFTER transition_reason,
  ADD COLUMN receiving_school_name VARCHAR(200) NULL AFTER transition_effective_date,
  ADD COLUMN transitioned_by CHAR(26) NULL AFTER receiving_school_name,
  ADD COLUMN transitioned_at DATETIME NULL AFTER transitioned_by,
  ADD CONSTRAINT fk_enr_transition_actor FOREIGN KEY (transitioned_by) REFERENCES users(id);

UPDATE enrollments
SET approved_at = updated_at
WHERE approved_by IS NOT NULL AND approved_at IS NULL;
