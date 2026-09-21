ALTER TABLE schools
  MODIFY COLUMN school_type ENUM('formal','tsangaya','non_formal','primary','secondary','integrated','islamiyya') NOT NULL,
  MODIFY COLUMN ownership ENUM('public','government','private','faith_based','community') NOT NULL;
