CREATE TABLE dashboard_priority_assignments (
  id CHAR(26) PRIMARY KEY,
  priority_key VARCHAR(120) NOT NULL UNIQUE,
  priority_type ENUM('enrollment_followup','attendance_followup','cnr','compliance','incentive') NOT NULL,
  source_entity_type VARCHAR(60) NOT NULL,
  source_entity_id CHAR(26) NOT NULL,
  owner_user_id CHAR(26) NULL,
  assigned_by CHAR(26) NOT NULL,
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_dpa_owner FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_dpa_assigner FOREIGN KEY (assigned_by) REFERENCES users(id),
  INDEX idx_dpa_owner (owner_user_id),
  INDEX idx_dpa_type_source (priority_type, source_entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE dashboard_priority_assignment_history (
  id CHAR(26) PRIMARY KEY,
  assignment_id CHAR(26) NOT NULL,
  previous_owner_user_id CHAR(26) NULL,
  new_owner_user_id CHAR(26) NULL,
  changed_by CHAR(26) NOT NULL,
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_dpah_assignment FOREIGN KEY (assignment_id) REFERENCES dashboard_priority_assignments(id) ON DELETE CASCADE,
  CONSTRAINT fk_dpah_previous_owner FOREIGN KEY (previous_owner_user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_dpah_new_owner FOREIGN KEY (new_owner_user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_dpah_changer FOREIGN KEY (changed_by) REFERENCES users(id),
  INDEX idx_dpah_assignment_time (assignment_id, changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE executive_dashboard_schedules (
  id CHAR(26) PRIMARY KEY,
  schedule_name VARCHAR(160) NOT NULL,
  cadence ENUM('monthly') NOT NULL DEFAULT 'monthly',
  owner_user_id CHAR(26) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_generated_month DATE NULL,
  next_due_month DATE NOT NULL,
  created_by CHAR(26) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_eds_owner FOREIGN KEY (owner_user_id) REFERENCES users(id),
  CONSTRAINT fk_eds_creator FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_eds_due (is_active, next_due_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE executive_dashboard_packs (
  id CHAR(26) PRIMARY KEY,
  schedule_id CHAR(26) NULL,
  period_month DATE NOT NULL,
  scope_label VARCHAR(200) NOT NULL,
  metrics_snapshot JSON NOT NULL,
  priorities_snapshot JSON NOT NULL,
  trend_snapshot JSON NOT NULL,
  generated_by CHAR(26) NOT NULL,
  generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_edp_schedule FOREIGN KEY (schedule_id) REFERENCES executive_dashboard_schedules(id) ON DELETE SET NULL,
  CONSTRAINT fk_edp_generator FOREIGN KEY (generated_by) REFERENCES users(id),
  UNIQUE KEY uq_edp_schedule_month (schedule_id, period_month),
  INDEX idx_edp_period (period_month DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO program_rules(id,rule_key,rule_value,updated_by)
SELECT '01M0P0DASHBOARDSLATARGETS0','dashboardSlaTargets','{"enrollment_followup":14,"attendance_followup":7,"cnr":7,"compliance":14,"incentive":14}',NULL
WHERE NOT EXISTS (SELECT 1 FROM program_rules WHERE rule_key='dashboardSlaTargets');
