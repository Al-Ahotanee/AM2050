# AM2050 — Arewa Mission 2050

AM2050 is a React/Vite and pure PHP/MySQL education-access platform for child and household registration, school operations, enrollment, attendance, learning records, formal certificates, Guardian-safe alerts, and role-scoped field operations.

## Production deployment

This repository is prepared for a **same-origin Render Docker deployment** backed by **Aiven for MySQL**. The React frontend is served at `/` and the PHP API at `/api/v1` on the same HTTPS host, avoiding credentialed browser CORS dependencies.

Read the complete guide before deploying:

> [`deployment/RENDER_AIVEN_GITHUB_DEPLOYMENT.md`](deployment/RENDER_AIVEN_GITHUB_DEPLOYMENT.md)

The private export command is:

```bash
DB_HOST=127.0.0.1 DB_PORT=3306 DB_NAME=am2050_dev DB_USER=am2050 DB_PASS='your-local-password' \
  ./scripts/export-render-aiven-package.sh
```

It creates a ZIP under `deployment/artifacts/`, with source code, migrations, a private sandbox baseline database export, the Render Blueprint, Aiven TLS configuration template, GitHub Actions quality gate, and deployment instructions. It excludes local environment files, credentials, build output, dependencies, logs, historical package artefacts, and populated refresh-token rows.

## Security release gate

Before real-world use, create or rotate all staff credentials, replace sandbox identities and records as required by the programme, configure an independent `JWT_SECRET`, keep the Aiven CA material in Render secrets only, and complete the documented deployment acceptance tests.
