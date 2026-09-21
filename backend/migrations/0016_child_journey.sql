CREATE TABLE child_journey_events (
  id CHAR(26) PRIMARY KEY,
  child_id CHAR(26) NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  occurred_at DATETIME NOT NULL,
  recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  source_type VARCHAR(64) NOT NULL,
  source_id CHAR(26) NULL,
  source_key VARCHAR(190) NOT NULL,
  summary VARCHAR(500) NOT NULL,
  event_details JSON NULL,
  guardian_visible BOOLEAN NOT NULL DEFAULT FALSE,
  actor_user_id CHAR(26) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_journey_child FOREIGN KEY (child_id) REFERENCES children(id),
  CONSTRAINT fk_journey_actor FOREIGN KEY (actor_user_id) REFERENCES users(id),
  UNIQUE KEY uq_journey_source (child_id, source_key),
  INDEX idx_journey_child_time (child_id, occurred_at DESC, id DESC),
  INDEX idx_journey_type_time (event_type, occurred_at DESC),
  INDEX idx_journey_guardian (child_id, guardian_visible, occurred_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE child_journey_summaries (
  child_id CHAR(26) PRIMARY KEY,
  current_stage VARCHAR(64) NOT NULL,
  next_action VARCHAR(300) NOT NULL,
  active_school_id CHAR(26) NULL,
  active_class_id CHAR(26) NULL,
  last_event_at DATETIME NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_journey_summary_child FOREIGN KEY (child_id) REFERENCES children(id),
  CONSTRAINT fk_journey_summary_school FOREIGN KEY (active_school_id) REFERENCES schools(id),
  CONSTRAINT fk_journey_summary_class FOREIGN KEY (active_class_id) REFERENCES school_classes(id),
  INDEX idx_journey_stage (current_stage),
  INDEX idx_journey_school (active_school_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE child_journey_backfill_runs (
  id CHAR(26) PRIMARY KEY,
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  status ENUM('running','completed','failed') NOT NULL DEFAULT 'running',
  processed_count INT NOT NULL DEFAULT 0,
  error_message TEXT NULL,
  started_by CHAR(26) NULL,
  CONSTRAINT fk_journey_backfill_actor FOREIGN KEY (started_by) REFERENCES users(id),
  INDEX idx_journey_backfill_status (status, started_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
