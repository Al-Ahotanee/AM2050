# AM2050 API Deployment Guide

## Runtime requirements

Deploy the `backend/` directory to a PHP **8.2+** host with Composer 2, MySQL 8, HTTPS, and a document root pointed at `backend/public`. Do not expose `src/`, `migrations/`, `scripts/`, or `vendor/` directly through the web server.

| Variable | Production requirement |
|---|---|
| `APP_ENV` | `production` |
| `APP_URL` | Canonical HTTPS API URL |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS` | Least-privilege MySQL credentials |
| `JWT_SECRET` | Unique, random secret with at least 32 characters; rotate through a controlled release |
| `JWT_ISSUER`, `JWT_AUDIENCE` | Stable API and frontend identifiers |
| `ACCESS_TOKEN_TTL_SECONDS` | Default: `900` |
| `REFRESH_TOKEN_TTL_SECONDS` | Default: `604800` |
| `CORS_ALLOWED_ORIGIN` | Exact public frontend origin; never `*` |
| `COOKIE_SECURE` | `true` on every HTTPS deployment |

Use `COOKIE_SAMESITE=Strict` for a same-origin frontend/API deployment. For a separately hosted frontend that must send refresh cookies to the API, use `COOKIE_SAMESITE=None`, keep `COOKIE_SECURE=true`, and set `CORS_ALLOWED_ORIGIN` to the exact frontend origin.

Build the frontend with `VITE_AM2050_API_URL` set to the canonical HTTPS API origin followed by `/api/v1` when the frontend and PHP API use different origins. If they share a host, configure the reverse proxy to route `/api/v1` to PHP and leave this frontend variable unset.

The application intentionally does not include an environment file. Set these variables using the host’s secret manager or process configuration; do not commit passwords or JWT secrets.

## Release procedure

1. Create a dedicated MySQL schema and restricted database account with access only to that schema.
2. Run `composer install --no-dev --optimize-autoloader` from `backend/`.
3. Provide the required environment variables through the server configuration.
4. Run `php scripts/migrate.php` with the same variables in scope.
5. Run `php scripts/seed.php` to bootstrap **Jigawa State → Buji LGA → Ahoto Ward**. This creates no communities, users, passwords, households, children, or education records.
6. Set the four one-time `BOOTSTRAP_ADMIN_*` values and run `php scripts/create-admin.php`; immediately remove `BOOTSTRAP_ADMIN_PASSWORD` from the server environment.
7. Configure the web server to send all unmatched API paths to `public/index.php` and to block direct access to hidden files and source directories.
8. Confirm `GET /api/v1/health`, authenticated login, a scoped record query, and the `/sync/batch` idempotency flow before allowing field use.

## Operational controls

Back up MySQL before every migration and rehearse restore procedures. Retain audit logs according to AM2050’s approved retention policy. Monitor failed logins, open `sync_conflict` compliance flags, MySQL connection failures, HTTP 5xx responses, queue depth, and daily encrypted backups. The application has a database-backed five-failure, fifteen-minute account lock; retain this control in all deployment tiers.
