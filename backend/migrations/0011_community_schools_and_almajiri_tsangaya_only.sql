ALTER TABLE tsangaya_schools
  ADD COLUMN community_id CHAR(26) NULL AFTER ward_id,
  ADD CONSTRAINT fk_tsy_community FOREIGN KEY (community_id) REFERENCES communities(id),
  ADD INDEX idx_tsy_community (community_id);

ALTER TABLE almajiri_links
  DROP FOREIGN KEY fk_al_household,
  DROP COLUMN home_household_id;
