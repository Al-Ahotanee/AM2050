#!/usr/bin/env bash
# AM2050 deep audit: live role and authorization evidence only. No operational record is created or changed.
set -euo pipefail

BASE_URL="${AM2050_API_URL:-http://127.0.0.1:8081/api/v1}"
PASSWORD="${AM2050_SANDBOX_PASSWORD:-AM2050-Sandbox-2026!}"
OUT="${1:-/home/ubuntu/am2050/AUDIT_ROLE_MATRIX_2026-08-21.md}"

declare -A PHONE=(
  [super_admin]=09024355355
  [program_admin]=08000000011
  [lga_supervisor]=08000000012
  [ward_supervisor]=08000000013
  [headmaster]=08000000014
  [mobilizer]=08000000015
  [almajiri_liaison]=08000000016
  [teacher]=08000000017
  [guardian]=08000000018
)

declare -A TOKEN
PASS=0
FAIL=0

request_code() {
  local method="$1" token="$2" path="$3" body="${4:-}"
  if [[ -n "$body" ]]; then
    curl -sS -o /dev/null -w '%{http_code}' -X "$method" "$BASE_URL$path" \
      -H "Authorization: Bearer $token" -H 'Content-Type: application/json' --data "$body"
  else
    curl -sS -o /dev/null -w '%{http_code}' -X "$method" "$BASE_URL$path" \
      -H "Authorization: Bearer $token"
  fi
}

record() {
  local name="$1" expected="$2" actual="$3"
  local verdict="PASS"
  if [[ ",$expected," != *",$actual,"* ]]; then verdict="FAIL"; FAIL=$((FAIL+1)); else PASS=$((PASS+1)); fi
  printf '| %s | `%s` | `%s` | %s |\n' "$name" "$expected" "$actual" "$verdict" >> "$OUT"
}

login() {
  local role="$1" response token
  response="$(curl -sS -X POST "$BASE_URL/auth/login" -H 'Content-Type: application/json' --data "{\"phone\":\"${PHONE[$role]}\",\"password\":\"$PASSWORD\"}")"
  token="$(printf '%s' "$response" | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')"
  if [[ -z "$token" ]]; then
    printf '| %s login and identity | `200` | `login failed` | FAIL |\n' "$role" >> "$OUT"
    FAIL=$((FAIL+1))
    return 1
  fi
  TOKEN[$role]="$token"
  record "$role login and identity" "200" "$(request_code GET "$token" /auth/me)"
}

cat > "$OUT" <<'EOF'
# AM2050 Live Nine-Role API Audit — 2026-08-21

> This evidence is generated against the local PHP/MySQL sandbox. It deliberately uses only safe reads and invalid, empty protected write requests; it does not create, update, or remove operational records.

| Check | Expected HTTP status | Actual HTTP status | Result |
|---|---:|---:|---|
EOF

for role in super_admin program_admin lga_supervisor ward_supervisor headmaster mobilizer almajiri_liaison teacher guardian; do
  login "$role"
done

for role in super_admin program_admin lga_supervisor ward_supervisor headmaster mobilizer almajiri_liaison teacher guardian; do
  token="${TOKEN[$role]}"
  child_expected="200"
  if [[ "$role" == "almajiri_liaison" || "$role" == "guardian" ]]; then child_expected="403"; fi
  record "$role child-register policy" "$child_expected" "$(request_code GET "$token" '/children?limit=1')"
  record "$role safe enrollment read" "200,403" "$(request_code GET "$token" '/enrollments?limit=1')"
done

record "Headmaster cannot register a child" "403" "$(request_code POST "${TOKEN[headmaster]}" /children '{}')"
record "Teacher cannot register a child" "403" "$(request_code POST "${TOKEN[teacher]}" /children '{}')"
record "Headmaster cannot register a household" "403" "$(request_code POST "${TOKEN[headmaster]}" /households '{}')"
record "Teacher cannot register a household" "403" "$(request_code POST "${TOKEN[teacher]}" /households '{}')"
record "Super Admin cannot mark attendance" "403" "$(request_code POST "${TOKEN[super_admin]}" /attendance '{}')"
record "Programme Admin cannot mark attendance" "403" "$(request_code POST "${TOKEN[program_admin]}" /attendance '{}')"
record "Super Admin cannot write results" "403" "$(request_code POST "${TOKEN[super_admin]}" /results '{}')"
record "Programme Admin cannot write behavior" "403" "$(request_code POST "${TOKEN[program_admin]}" /behavioral-trackers '{}')"
record "Guardian cannot read general dashboard metrics" "403" "$(request_code GET "${TOKEN[guardian]}" /dashboard/stats)"
record "Guardian can read only family records" "200" "$(request_code GET "${TOKEN[guardian]}" /guardian/children)"
record "Headmaster has QR scan authorization before request validation" "400,422" "$(request_code POST "${TOKEN[headmaster]}" /attendance/scan '{}')"
record "Teacher has QR scan authorization before request validation" "400,422" "$(request_code POST "${TOKEN[teacher]}" /attendance/scan '{}')"
record "Headmaster can submit a teacher request before request validation" "400,422" "$(request_code POST "${TOKEN[headmaster]}" /teacher-requests '{}')"
record "Super Admin can read school personnel requests" "200" "$(request_code GET "${TOKEN[super_admin]}" /teacher-requests)"
record "Super Admin can access school registration route before request validation" "400,422" "$(request_code POST "${TOKEN[super_admin]}" /schools '{}')"
record "Almajiri liaison can read Tsangaya register" "200" "$(request_code GET "${TOKEN[almajiri_liaison]}" /tsangaya-schools)"
record "School staff can submit CNR before request validation" "400,422" "$(request_code POST "${TOKEN[teacher]}" /school-child-referrals '{}')"

{
  printf '\n## Summary\n\n'
  printf '| Passed | Failed |\n|---:|---:|\n| %s | %s |\n' "$PASS" "$FAIL"
  if [[ "$FAIL" -eq 0 ]]; then
    printf '\nAll live authorization checks passed.\n'
  else
    printf '\nOne or more checks failed and require remediation before release.\n'
  fi
} >> "$OUT"

[[ "$FAIL" -eq 0 ]]
