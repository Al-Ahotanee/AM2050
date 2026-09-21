# AM2050 Production Deployment Guide — GitHub, Render, and Aiven MySQL

## 1. Deployment architecture

AM2050 is deployed as **one Render Docker web service**. The React/Vite application is served at `/`; the PHP 8.3 API is served at `/api/v1` from the same HTTPS host. This is the required production topology because it keeps login and refresh cookies same-site and removes the transient sandbox-host CORS dependency.

> Do **not** set `VITE_AM2050_API_URL` to a `*.manus.computer` address. In the Render Blueprint it must remain `/api/v1`.

| Component | Production responsibility |
| --- | --- |
| GitHub private repository | Source control and CI quality gate |
| Render Docker web service | React SPA, Apache routing, PHP API, migrations, TLS endpoint |
| Aiven for MySQL | MySQL database with CA-verified TLS |
| Render environment variables | Database credentials, CA material, JWT secret, production runtime settings |

Render supports Docker services built from a repository Dockerfile, including pre-deploy migration commands.[^render-docker] [^render-blueprint] Aiven documents CA-verified PHP/PDO connections for MySQL services.[^aiven-php]

## 2. What the private ZIP contains

Run the export command from the repository root after setting the local database connection values:

```bash
DB_HOST=127.0.0.1 DB_PORT=3306 DB_NAME=am2050_dev DB_USER=am2050 DB_PASS='your-local-password' \
  ./scripts/export-render-aiven-package.sh
```

The ZIP contains the current application source, PHP migrations, Composer configuration, Dockerfile, Apache same-origin routing, Render Blueprint, Aiven/Render environment template, GitHub quality workflow, this guide, and `deployment/database/am2050_sandbox_baseline.sql.gz`. The baseline retains the sandbox schema and operational data but deliberately excludes active refresh-token rows. It does **not** contain `.env` files, Aiven credentials, CA certificates, JWT values, Node dependencies, Composer vendor files, build output, logs, or prior ZIPs.

## 3. Create a private GitHub repository

Extract the ZIP, create a **private** GitHub repository, then commit only the supplied source. Do not add populated environment files, the Aiven CA certificate, or the `deployment/database/` directory to Git.

```bash
git init
git add .
git commit -m "AM2050 production deployment package"
git branch -M main
git remote add origin https://github.com/YOUR-ORGANISATION/am2050-platform.git
git push -u origin main
```

The included GitHub Action runs `pnpm check`, a same-origin production build, Composer install, and PHP syntax validation on pull requests and pushes to `main`.

## 4. Create Aiven for MySQL with TLS

Create an Aiven for MySQL service in the Aiven Console. Plan availability and pricing are determined by Aiven at the time of creation; this package is compatible with an Aiven MySQL service that provides MySQL connection details and a CA certificate. From the service **Overview**, collect the host, port, database name, user, password, and CA certificate.

Convert the certificate to a one-line Base64 string for the Render secret field:

```bash
base64 -w0 ca.pem > ca.base64
```

On macOS:

```bash
base64 < ca.pem | tr -d '\n' > ca.base64
```

Keep `ca.pem` and `ca.base64` private. AM2050 uses `DB_SSL_REQUIRED=true` and `DB_SSL_CA_BASE64` to create a CA-verified PDO MySQL connection, matching Aiven’s documented TLS approach.[^aiven-php]

## 5. Import the private sandbox baseline

Use the private ZIP’s database export only for controlled testing. It includes sandbox records and password hashes; force password resets or replace these accounts before real operation.

```bash
export DB_HOST='mysql-your-service.aivencloud.com'
export DB_PORT='3306'
export DB_NAME='defaultdb'
export DB_USER='avnadmin'
export DB_PASS='your-aiven-password'

gunzip -c deployment/database/am2050_sandbox_baseline.sql.gz | mysql \
  --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USER" --password \
  --ssl-mode=VERIFY_CA --ssl-ca=ca.pem "$DB_NAME"
```

The migration runner is idempotent and applies only migrations newer than the imported baseline. For an empty production database instead, follow `backend/DEPLOYMENT.md` to run `php scripts/migrate.php`, `php scripts/seed.php`, and the controlled `create-admin.php` bootstrap sequence.

## 6. Deploy with the Render Blueprint

In Render, choose **New → Blueprint**, connect the private GitHub repository, and approve `render.yaml`. The Blueprint creates one Docker web service using the root `Dockerfile`; its health check is `/api/v1/health`, and its pre-deploy command runs the PHP migration runner.

Enter the prompted variables in Render’s secret management interface:

| Variable | Value |
| --- | --- |
| `DB_HOST` | Aiven MySQL host |
| `DB_PORT` | Aiven MySQL port |
| `DB_NAME` | Aiven database name |
| `DB_USER` | Aiven username |
| `DB_PASS` | Aiven password |
| `DB_SSL_CA_BASE64` | One-line contents of `ca.base64` |
| `JWT_SECRET` | Render-generated secret; do not replace with a sandbox value |

The Blueprint already sets `APP_ENV=production`, `APP_TIMEZONE=Africa/Lagos`, `VITE_AM2050_API_URL=/api/v1`, `DB_SSL_REQUIRED=true`, `COOKIE_SECURE=true`, and `COOKIE_SAMESITE=Strict`. Same-origin deployment does not require `CORS_ALLOWED_ORIGIN`. Set that value only for an approved separately hosted frontend, using an exact origin and never a wildcard.

## 7. Production acceptance test

After Render reports a healthy deployment, visit:

```text
https://YOUR-RENDER-SERVICE.onrender.com/api/v1/health
```

Expected response:

```json
{"success":true,"data":{"status":"ok","service":"am2050-api"}}
```

Then confirm, using a non-sandbox or newly rotated authorised account, that login succeeds; a page reload refreshes the session; `/workspace` loads; role scope is correct; the Household, Child, Enrollment, Attendance, Certificate, and Guardian routes behave as authorised; and the browser console has no CORS errors. Verify `/api/v1` requests remain on the Render service’s own origin.

## 8. Go-live controls and rollback

Before accepting real field data, rotate all imported sandbox passwords, replace any sandbox test data as required, set the factual geography for production schools, protect the GitHub repository, restrict Render and Aiven access, rehearse Aiven backup restoration, and document safeguarding, consent, retention, and incident procedures.

For a failed release, redeploy the last healthy Render deployment. Do not use destructive SQL as a rollback. Restore Aiven data only from an approved backup and with an audited recovery plan.

## 9. Local container validation

Create a private `backend/.env` from `.env.render.example`, then run:

```bash
docker build --build-arg VITE_AM2050_API_URL=/api/v1 -t am2050 .
docker run --rm -p 10000:10000 --env-file backend/.env -e PORT=10000 am2050
```

Open `http://localhost:10000/api/v1/health`.

## References

[^render-docker]: [Render, “Docker on Render”](https://render.com/docs/docker)
[^render-blueprint]: [Render, “Blueprint YAML Reference”](https://render.com/docs/blueprint-spec)
[^aiven-php]: [Aiven, “Connect to Aiven for MySQL with PHP”](https://aiven.io/docs/products/mysql/howto/connect-with-php)
