-- AM2050 baseline schema. All IDs are ULIDs; human-readable codes are generated transactionally from id_sequences.
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE states (
  id CHAR(26) PRIMARY KEY, name VARCHAR(100) NOT NULL, code VARCHAR(10) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE lgas (
  id CHAR(26) PRIMARY KEY, name VARCHAR(150) NOT NULL, state_id CHAR(26) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_lga_state FOREIGN KEY (state_id) REFERENCES states(id), INDEX idx_lga_state (state_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE wards (
  id CHAR(26) PRIMARY KEY, name VARCHAR(150) NOT NULL, lga_id CHAR(26) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ward_lga FOREIGN KEY (lga_id) REFERENCES lgas(id), INDEX idx_ward_lga (lga_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE communities (
  id CHAR(26) PRIMARY KEY, name VARCHAR(150) NOT NULL, ward_id CHAR(26) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_community_ward FOREIGN KEY (ward_id) REFERENCES wards(id), INDEX idx_community_ward (ward_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
  id CHAR(26) PRIMARY KEY, name VARCHAR(200) NOT NULL,
  role ENUM('super_admin','program_admin','lga_supervisor','ward_supervisor','headmaster','mobilizer','almajiri_liaison','teacher','guardian') NOT NULL DEFAULT 'mobilizer',
  phone VARCHAR(20) NOT NULL UNIQUE, email VARCHAR(200) UNIQUE, password_hash VARCHAR(255) NOT NULL,
  assigned_scope_type ENUM('state','lga','ward','school','class') NULL, assigned_scope_id CHAR(26) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE, last_login DATETIME NULL, failed_login_count INT NOT NULL DEFAULT 0, locked_until DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_role (role), INDEX idx_user_scope (assigned_scope_type, assigned_scope_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE refresh_tokens (
  id CHAR(26) PRIMARY KEY, user_id CHAR(26) NOT NULL, token_hash VARCHAR(255) NOT NULL UNIQUE, expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, INDEX idx_rt_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE households (
  id CHAR(26) PRIMARY KEY, household_code VARCHAR(30) NOT NULL UNIQUE, father_name VARCHAR(200) NULL, mother_name VARCHAR(200) NULL,
  phone_number VARCHAR(20) NULL, community_id CHAR(26) NULL, ward_id CHAR(26) NOT NULL, gps_lat DECIMAL(10,7) NULL, gps_lng DECIMAL(10,7) NULL,
  poverty_status ENUM('extreme_poor','poor','moderate','not_poor') NULL, household_type VARCHAR(50) NULL, registered_by CHAR(26) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_hh_community FOREIGN KEY (community_id) REFERENCES communities(id), CONSTRAINT fk_hh_ward FOREIGN KEY (ward_id) REFERENCES wards(id),
  CONSTRAINT fk_hh_registrar FOREIGN KEY (registered_by) REFERENCES users(id), INDEX idx_hh_ward (ward_id), INDEX idx_hh_registrar (registered_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE children (
  id CHAR(26) PRIMARY KEY, child_unique_id VARCHAR(30) NOT NULL UNIQUE, first_name VARCHAR(150) NOT NULL, last_name VARCHAR(150) NOT NULL,
  gender ENUM('male','female') NOT NULL, date_of_birth DATE NULL, estimated_age INT NULL, photo_url VARCHAR(500) NULL, household_id CHAR(26) NULL,
  guardian_phone VARCHAR(20) NULL, ward_id CHAR(26) NULL,
  disability_status ENUM('none','physical','visual','hearing','cognitive','multiple') NOT NULL DEFAULT 'none',
  almajiri_status ENUM('not_almajiri','almajiri') NOT NULL DEFAULT 'not_almajiri', child_status ENUM('active','deceased','relocated','untraceable') NOT NULL DEFAULT 'active',
  registered_by CHAR(26) NOT NULL, duplicate_flag BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_child_household FOREIGN KEY (household_id) REFERENCES households(id), CONSTRAINT fk_child_ward FOREIGN KEY (ward_id) REFERENCES wards(id),
  CONSTRAINT fk_child_registrar FOREIGN KEY (registered_by) REFERENCES users(id), INDEX idx_child_household (household_id), INDEX idx_child_ward (ward_id),
  INDEX idx_child_almajiri (almajiri_status), INDEX idx_child_status (child_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE schools (
  id CHAR(26) PRIMARY KEY, school_id VARCHAR(20) NOT NULL UNIQUE, school_name VARCHAR(200) NOT NULL,
  school_type ENUM('primary','secondary','integrated','islamiyya') NOT NULL, ownership ENUM('government','private','faith_based','community') NOT NULL,
  ward_id CHAR(26) NOT NULL, community_id CHAR(26) NULL, headmaster_user_id CHAR(26) NULL, total_capacity INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_school_ward FOREIGN KEY (ward_id) REFERENCES wards(id), CONSTRAINT fk_school_community FOREIGN KEY (community_id) REFERENCES communities(id),
  CONSTRAINT fk_school_headmaster FOREIGN KEY (headmaster_user_id) REFERENCES users(id), INDEX idx_school_ward (ward_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE school_classes (
  id CHAR(26) PRIMARY KEY, class_code VARCHAR(30) NOT NULL UNIQUE, class_name VARCHAR(100) NOT NULL, school_id CHAR(26) NOT NULL,
  teacher_id CHAR(26) NULL, class_level VARCHAR(50) NOT NULL DEFAULT 'Primary 1', capacity INT NOT NULL DEFAULT 40, academic_year VARCHAR(20) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_class_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE, CONSTRAINT fk_class_teacher FOREIGN KEY (teacher_id) REFERENCES users(id),
  INDEX idx_class_school (school_id), INDEX idx_class_teacher (teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE academic_sessions (
  id CHAR(26) PRIMARY KEY, session_name VARCHAR(20) NOT NULL, state_id CHAR(26) NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL,
  status ENUM('upcoming','active','completed') NOT NULL DEFAULT 'upcoming', created_by CHAR(26) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_session_state FOREIGN KEY (state_id) REFERENCES states(id), CONSTRAINT fk_session_creator FOREIGN KEY (created_by) REFERENCES users(id),
  UNIQUE KEY uq_session_state (session_name, state_id), INDEX idx_session_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE terms (
  id CHAR(26) PRIMARY KEY, term_name ENUM('First Term','Second Term','Third Term') NOT NULL, academic_year VARCHAR(20) NOT NULL,
  start_date DATE NOT NULL, end_date DATE NOT NULL, status ENUM('upcoming','active','completed') NOT NULL DEFAULT 'upcoming',
  session_id CHAR(26) NULL, school_id CHAR(26) NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_term_session FOREIGN KEY (session_id) REFERENCES academic_sessions(id), CONSTRAINT fk_term_school FOREIGN KEY (school_id) REFERENCES schools(id),
  UNIQUE KEY uq_term (term_name, academic_year, school_id), INDEX idx_term_status (status), INDEX idx_term_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE subjects (
  id CHAR(26) PRIMARY KEY, subject_name VARCHAR(100) NOT NULL, subject_code VARCHAR(20) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE class_subjects (
  id CHAR(26) PRIMARY KEY, class_id CHAR(26) NOT NULL, subject_id CHAR(26) NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cs_class FOREIGN KEY (class_id) REFERENCES school_classes(id) ON DELETE CASCADE, CONSTRAINT fk_cs_subject FOREIGN KEY (subject_id) REFERENCES subjects(id),
  UNIQUE KEY uq_class_subject (class_id, subject_id), INDEX idx_cs_class (class_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE enrollments (
  id CHAR(26) PRIMARY KEY, child_id CHAR(26) NOT NULL, school_id CHAR(26) NOT NULL, class_id CHAR(26) NULL, class_level VARCHAR(50) NOT NULL,
  enrollment_status ENUM('active','withdrawn','graduated','transferred') NOT NULL DEFAULT 'active', enrollment_date DATE NOT NULL, approved_by CHAR(26) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_enr_child FOREIGN KEY (child_id) REFERENCES children(id), CONSTRAINT fk_enr_school FOREIGN KEY (school_id) REFERENCES schools(id),
  CONSTRAINT fk_enr_class FOREIGN KEY (class_id) REFERENCES school_classes(id), CONSTRAINT fk_enr_approver FOREIGN KEY (approved_by) REFERENCES users(id),
  INDEX idx_enr_child (child_id), INDEX idx_enr_school (school_id), INDEX idx_enr_status (enrollment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE attendance (
  id CHAR(26) PRIMARY KEY, child_id CHAR(26) NOT NULL, school_id CHAR(26) NOT NULL, class_id CHAR(26) NULL, date DATE NOT NULL,
  attendance_status ENUM('present','absent','late','excused') NOT NULL DEFAULT 'present', scanned_by CHAR(26) NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_att_child FOREIGN KEY (child_id) REFERENCES children(id), CONSTRAINT fk_att_school FOREIGN KEY (school_id) REFERENCES schools(id),
  CONSTRAINT fk_att_class FOREIGN KEY (class_id) REFERENCES school_classes(id), CONSTRAINT fk_att_scanner FOREIGN KEY (scanned_by) REFERENCES users(id),
  UNIQUE KEY uq_attendance_day (child_id, date), INDEX idx_att_school_date (school_id, date), INDEX idx_att_class_date (class_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE student_results (
  id CHAR(26) PRIMARY KEY, enrollment_id CHAR(26) NOT NULL, term_id CHAR(26) NOT NULL, subject VARCHAR(100) NOT NULL, score DECIMAL(5,2) NOT NULL,
  grade VARCHAR(5) NULL, comments TEXT NULL, recorded_by CHAR(26) NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_result_enr FOREIGN KEY (enrollment_id) REFERENCES enrollments(id), CONSTRAINT fk_result_term FOREIGN KEY (term_id) REFERENCES terms(id), CONSTRAINT fk_result_recorder FOREIGN KEY (recorded_by) REFERENCES users(id),
  UNIQUE KEY uq_result (enrollment_id, term_id, subject), INDEX idx_result_enrollment (enrollment_id), INDEX idx_result_term (term_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE behavioral_trackers (
  id CHAR(26) PRIMARY KEY, enrollment_id CHAR(26) NOT NULL, term_id CHAR(26) NOT NULL, behavior_type VARCHAR(50) NOT NULL, rating TINYINT NOT NULL,
  comments TEXT NULL, recorded_by CHAR(26) NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bt_enr FOREIGN KEY (enrollment_id) REFERENCES enrollments(id), CONSTRAINT fk_bt_term FOREIGN KEY (term_id) REFERENCES terms(id), CONSTRAINT fk_bt_recorder FOREIGN KEY (recorded_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tsangaya_schools (
  id CHAR(26) PRIMARY KEY, tsangaya_id VARCHAR(20) NOT NULL UNIQUE, tsangaya_name VARCHAR(200) NOT NULL, mallam_name VARCHAR(200) NULL, ward_id CHAR(26) NOT NULL,
  registration_status ENUM('unregistered','pending','registered') NOT NULL DEFAULT 'unregistered', number_of_pupils_reported INT NOT NULL DEFAULT 0, integrated_school_id CHAR(26) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tsy_ward FOREIGN KEY (ward_id) REFERENCES wards(id), CONSTRAINT fk_tsy_school FOREIGN KEY (integrated_school_id) REFERENCES schools(id), INDEX idx_tsy_ward (ward_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE almajiri_links (
  id CHAR(26) PRIMARY KEY, child_id CHAR(26) NOT NULL, tsangaya_id CHAR(26) NOT NULL, home_ward_id CHAR(26) NULL, home_household_id CHAR(26) NULL,
  current_status ENUM('active','returned_home','transferred','inactive') NOT NULL DEFAULT 'active', welfare_flag BOOLEAN NOT NULL DEFAULT FALSE, welfare_notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_al_child FOREIGN KEY (child_id) REFERENCES children(id), CONSTRAINT fk_al_tsy FOREIGN KEY (tsangaya_id) REFERENCES tsangaya_schools(id),
  CONSTRAINT fk_al_ward FOREIGN KEY (home_ward_id) REFERENCES wards(id), CONSTRAINT fk_al_household FOREIGN KEY (home_household_id) REFERENCES households(id),
  INDEX idx_al_tsangaya (tsangaya_id), INDEX idx_al_child (child_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE incentives (
  id CHAR(26) PRIMARY KEY, child_id CHAR(26) NOT NULL, month DATE NOT NULL, attendance_rate DECIMAL(5,2) NULL,
  eligibility_status ENUM('pending_review','eligible','ineligible') NOT NULL DEFAULT 'pending_review', incentive_type VARCHAR(30) NOT NULL DEFAULT 'materials',
  payment_status ENUM('pending','approved','disbursed','rejected') NOT NULL DEFAULT 'pending', approved_by CHAR(26) NULL, disbursed_by CHAR(26) NULL,
  disbursement_date DATETIME NULL, disbursement_reference VARCHAR(100) NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_inc_child FOREIGN KEY (child_id) REFERENCES children(id), CONSTRAINT fk_inc_approver FOREIGN KEY (approved_by) REFERENCES users(id), CONSTRAINT fk_inc_disburser FOREIGN KEY (disbursed_by) REFERENCES users(id),
  INDEX idx_inc_child (child_id), INDEX idx_inc_month (month), INDEX idx_inc_payment (payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE compliance_flags (
  id CHAR(26) PRIMARY KEY, flag_type VARCHAR(50) NOT NULL, entity_type VARCHAR(50) NOT NULL, entity_id CHAR(26) NOT NULL, ward_id CHAR(26) NULL,
  status ENUM('open','in_review','resolved','dismissed') NOT NULL DEFAULT 'open', sla_due_date DATE NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cf_ward FOREIGN KEY (ward_id) REFERENCES wards(id), INDEX idx_cf_status (status), INDEX idx_cf_ward (ward_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE cohorts (
  id CHAR(26) PRIMARY KEY, name VARCHAR(200) NOT NULL, description TEXT NULL, cohort_type VARCHAR(50) NOT NULL, start_date DATE NOT NULL,
  status ENUM('active','completed','archived') NOT NULL DEFAULT 'active', created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE cohort_members (
  id CHAR(26) PRIMARY KEY, cohort_id CHAR(26) NOT NULL, child_id CHAR(26) NOT NULL, added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cm_cohort FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE CASCADE, CONSTRAINT fk_cm_child FOREIGN KEY (child_id) REFERENCES children(id), UNIQUE KEY uq_cohort_member (cohort_id, child_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE out_of_school_history (
  id CHAR(26) PRIMARY KEY, snapshot_date DATE NOT NULL, ward_id CHAR(26) NOT NULL, total_children INT NOT NULL, enrolled_children INT NOT NULL, out_of_school_children INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT fk_oos_ward FOREIGN KEY (ward_id) REFERENCES wards(id), UNIQUE KEY uq_oos_snapshot (snapshot_date, ward_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE program_rules (
  id CHAR(26) PRIMARY KEY, rule_key VARCHAR(100) NOT NULL UNIQUE, rule_value JSON NOT NULL, updated_by CHAR(26) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_rule_updater FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE id_sequences (
  seq_key VARCHAR(50) PRIMARY KEY, value INT NOT NULL DEFAULT 0, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE household_survey_events (
  id CHAR(26) PRIMARY KEY, household_id CHAR(26) NOT NULL, surveyor_id CHAR(26) NOT NULL, survey_date DATE NOT NULL, notes TEXT NULL,
  newborns_reported INT NOT NULL DEFAULT 0, unregistered_children_reported INT NOT NULL DEFAULT 0, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_survey_household FOREIGN KEY (household_id) REFERENCES households(id), CONSTRAINT fk_survey_surveyor FOREIGN KEY (surveyor_id) REFERENCES users(id),
  INDEX idx_survey_household (household_id), INDEX idx_survey_date (survey_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE unregistered_child_reports (
  id CHAR(26) PRIMARY KEY, survey_event_id CHAR(26) NOT NULL, household_id CHAR(26) NOT NULL, approximate_first_name VARCHAR(150) NULL,
  approximate_age INT NULL, gender ENUM('male','female','unknown') NOT NULL DEFAULT 'unknown', status ENUM('reported','registered','could_not_locate') NOT NULL DEFAULT 'reported',
  converted_child_id CHAR(26) NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ucr_event FOREIGN KEY (survey_event_id) REFERENCES household_survey_events(id), CONSTRAINT fk_ucr_household FOREIGN KEY (household_id) REFERENCES households(id),
  CONSTRAINT fk_ucr_child FOREIGN KEY (converted_child_id) REFERENCES children(id), INDEX idx_ucr_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE audit_logs (
  id CHAR(26) PRIMARY KEY, actor_user_id CHAR(26) NULL, action VARCHAR(50) NOT NULL, entity_type VARCHAR(50) NOT NULL, entity_id CHAR(26) NOT NULL,
  before_value JSON NULL, after_value JSON NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id) REFERENCES users(id), INDEX idx_audit_entity (entity_type, entity_id), INDEX idx_audit_actor (actor_user_id), INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE notifications (
  id CHAR(26) PRIMARY KEY, user_id CHAR(26) NOT NULL, title VARCHAR(200) NOT NULL, message TEXT NULL, type VARCHAR(50) NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE, link VARCHAR(255) NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id), INDEX idx_notif_user_read (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE sync_queue (
  id CHAR(26) PRIMARY KEY, entity_type VARCHAR(50) NOT NULL, entity_id CHAR(26) NULL, temp_id CHAR(26) NULL, action VARCHAR(20) NOT NULL, payload JSON NOT NULL,
  status ENUM('pending','processed','failed','conflict') NOT NULL DEFAULT 'pending', error_message TEXT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, processed_at DATETIME NULL,
  INDEX idx_sq_status (status), UNIQUE KEY uq_sync_temp (temp_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE synced_temp_ids (
  temp_id CHAR(26) PRIMARY KEY, entity_type VARCHAR(50) NOT NULL, server_id CHAR(26) NOT NULL, generated_code VARCHAR(30) NULL,
  synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
