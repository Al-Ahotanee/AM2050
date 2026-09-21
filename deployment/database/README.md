# AM2050 Database Import Assets

`am2050_sandbox_baseline.sql.gz` is created only in the final private deployment ZIP. It contains the current **sandbox baseline data**, including records and photographs stored in the database. It is intentionally ignored by Git and must **not** be committed to a GitHub repository.

Import it into the intended Aiven database before the first Render deployment:

```bash
gunzip -c am2050_sandbox_baseline.sql.gz | mysql \
  --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USER" --password \
  --ssl-mode=VERIFY_CA --ssl-ca=ca.pem "$DB_NAME"
```

The import contains schema and migration history. After import, Render's pre-deploy migration command is idempotent and applies only future migrations.

> This dataset is for a private, authorised environment only. It includes current sandbox operational records; rotate user credentials and obtain the required lawful data approvals before any public production use.
