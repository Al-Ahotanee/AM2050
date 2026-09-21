ALTER TABLE schools ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE, ADD INDEX idx_school_active (is_active);
