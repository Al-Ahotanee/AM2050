ALTER TABLE states ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE, ADD INDEX idx_state_active (is_active);
ALTER TABLE lgas ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE, ADD INDEX idx_lga_active (is_active);
ALTER TABLE wards ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE, ADD INDEX idx_ward_active (is_active);
ALTER TABLE communities ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE, ADD INDEX idx_community_active (is_active);
