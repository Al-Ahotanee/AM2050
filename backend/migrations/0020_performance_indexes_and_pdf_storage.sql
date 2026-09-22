-- Migration 0020: High-performance composite indexes and Cloudinary PDF asset storage support
CREATE TABLE IF NOT EXISTS rate_limits (
    key_name VARCHAR(191) PRIMARY KEY,
    attempts INT NOT NULL DEFAULT 1,
    reset_at INT NOT NULL,
    INDEX idx_rate_limits_reset (reset_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE executive_dashboard_packs ADD COLUMN pdf_url VARCHAR(500) NULL AFTER trend_snapshot;

CREATE INDEX idx_attendance_school_date ON attendance(school_id, date, attendance_status);
CREATE INDEX idx_attendance_child_date ON attendance(child_id, date);
CREATE INDEX idx_enrollments_school_status ON enrollments(school_id, enrollment_status);
CREATE INDEX idx_enrollments_child_status ON enrollments(child_id, enrollment_status);
CREATE INDEX idx_cje_child_occurred ON child_journey_events(child_id, occurred_at);
CREATE INDEX idx_children_ward ON children(ward_id);
CREATE INDEX idx_children_household ON children(household_id);
