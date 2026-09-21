ALTER TABLE children ADD COLUMN registration_details MEDIUMTEXT NULL AFTER photo_url;
ALTER TABLE households ADD COLUMN registration_details MEDIUMTEXT NULL AFTER photo_url;
ALTER TABLE enrollments ADD COLUMN registration_details MEDIUMTEXT NULL AFTER enrollment_date;
