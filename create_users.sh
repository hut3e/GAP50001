#!/bin/bash
# ════════════════════════════════════════════════════════════════════
# create_users.sh — Tạo user mẫu cho hệ thống GAP50001
# SECURITY: Không hardcode credentials. Set env vars trước khi chạy:
#   export ADMIN_USER=your_admin_username
#   export ADMIN_PASS=your_admin_password
#   export API_URL=http://localhost:5002
# ════════════════════════════════════════════════════════════════════

API_URL="${API_URL:-http://localhost:5002}"
ADMIN_USER="${ADMIN_USER:?ERROR: ADMIN_USER env var required}"
ADMIN_PASS="${ADMIN_PASS:?ERROR: ADMIN_PASS env var required}"

# Get Admin Token
echo "=== Đăng nhập Admin ==="
ATOKEN=$(curl -s -X POST "${API_URL}/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"username\":\"${ADMIN_USER}\",\"password\":\"${ADMIN_PASS}\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))")

if [ -z "$ATOKEN" ]; then
  echo "❌ Đăng nhập thất bại. Kiểm tra ADMIN_USER, ADMIN_PASS và API_URL."
  exit 1
fi
echo "✅ Đăng nhập thành công."

# Create auditor (credentials from env)
AUDITOR_USER="${AUDITOR_USER:-auditor01}"
AUDITOR_PASS="${AUDITOR_PASS:?ERROR: AUDITOR_PASS env var required}"
echo ""
echo "=== Tạo Auditor: ${AUDITOR_USER} ==="
curl -s -X POST "${API_URL}/api/auth/users" \
  -H "Authorization: Bearer ${ATOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{\"username\":\"${AUDITOR_USER}\",\"password\":\"${AUDITOR_PASS}\",\"role\":\"auditor\",\"displayName\":\"Auditor\"}"
echo ""

# Create viewer (credentials from env)
VIEWER_USER="${VIEWER_USER:-viewer01}"
VIEWER_PASS="${VIEWER_PASS:?ERROR: VIEWER_PASS env var required}"
echo ""
echo "=== Tạo Viewer: ${VIEWER_USER} ==="
curl -s -X POST "${API_URL}/api/auth/users" \
  -H "Authorization: Bearer ${ATOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{\"username\":\"${VIEWER_USER}\",\"password\":\"${VIEWER_PASS}\",\"role\":\"viewer\"}"
echo ""
echo "✅ Hoàn thành."
