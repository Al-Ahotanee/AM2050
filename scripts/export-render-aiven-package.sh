#!/usr/bin/env bash
set -euo pipefail

# Creates a private AM2050 deployment ZIP. It deliberately excludes local secrets and runtime artefacts.
# The data export retains the current sandbox operational baseline but omits refresh-token rows.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT_DIR="${ROOT}/deployment/artifacts"
STAGE="${OUT_DIR}/am2050-render-aiven-${STAMP}"
ZIP="${OUT_DIR}/am2050-render-aiven-${STAMP}.zip"

for command in mysqldump zip sha256sum tar gzip; do command -v "$command" >/dev/null || { echo "Missing required command: $command" >&2; exit 1; }; done
for variable in DB_HOST DB_NAME DB_USER DB_PASS; do [[ -n "${!variable:-}" ]] || { echo "Missing ${variable}" >&2; exit 1; }; done

rm -rf "$STAGE"
mkdir -p "$STAGE"
tar -C "$ROOT" \
  --exclude='.git' --exclude='.manus' --exclude='.manus-logs' --exclude='node_modules' --exclude='backend/vendor' --exclude='dist' --exclude='.pnpm-store' \
  --exclude='.env' --exclude='.env.local' --exclude='.env.development.local' --exclude='.env.test.local' \
  --exclude='.env.production' --exclude='.env.production.local' --exclude='backend/.env' --exclude='deployment/artifacts' \
  --exclude='deployment/database/*.sql' --exclude='deployment/database/*.sql.gz' --exclude='*.log' \
  --exclude='*_VERIFICATION_*.md' --exclude='AUDIT*.md' --exclude='DEEP_AUDIT_*.md' \
  --exclude='AM2050_MOBILE_RESPONSIVENESS_AUDIT_*.md' --exclude='CHILD_JOURNEY_IMPLEMENTATION_BLUEPRINT_*.md' \
  --exclude='ENHANCEMENT_ADOPTION_PLAN_*.md' --exclude='IMPLEMENTATION_STATUS.md' --exclude='ROLE_FUNCTIONALITY_COVERAGE.md' \
  --exclude='ideas.md' --exclude='todo.md' \
  -cf - . | tar -C "$STAGE" -xf -

mkdir -p "$STAGE/deployment/database"
{
  # Preserve the refresh-token table definition so schema_migrations stays valid, but do not ship active sessions.
  MYSQL_PWD="$DB_PASS" mysqldump --no-data --skip-tz-utc --no-tablespaces --default-character-set=utf8mb4 \
    --host="$DB_HOST" --port="${DB_PORT:-3306}" --user="$DB_USER" "$DB_NAME" refresh_tokens
  MYSQL_PWD="$DB_PASS" mysqldump --single-transaction --skip-tz-utc --no-tablespaces --routines --events --triggers --hex-blob \
    --default-character-set=utf8mb4 --ignore-table="${DB_NAME}.refresh_tokens" \
    --host="$DB_HOST" --port="${DB_PORT:-3306}" --user="$DB_USER" "$DB_NAME"
} | gzip -9 > "$STAGE/deployment/database/am2050_sandbox_baseline.sql.gz"

cat > "$STAGE/deployment/database/BASELINE_EXPORT_NOTICE.md" <<'EOF'
# Private baseline export notice

This compressed SQL file contains the current AM2050 sandbox schema and operational baseline for controlled deployment validation. It excludes populated refresh-token rows, local environment files, service credentials, and JWT secrets. Keep this file outside Git repositories and rotate every imported sandbox account password before real-world use.
EOF

(
  cd "$OUT_DIR"
  zip -qr "$(basename "$ZIP")" "$(basename "$STAGE")"
)
sha256sum "$ZIP" > "${ZIP}.sha256"
printf 'Created %s\nChecksum %s\n' "$ZIP" "${ZIP}.sha256"
