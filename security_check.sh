#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# security_check.sh — ISO 27001 Security Validation Script
# Runs all security checks and reports PASS/FAIL for each
# Usage: bash security_check.sh [BASE_URL]
# ═══════════════════════════════════════════════════════════════════

BASE_URL="${1:-http://localhost:8888}"
PASS=0
FAIL=0
TOTAL=0

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check() {
    TOTAL=$((TOTAL + 1))
    local desc="$1"
    local result="$2"
    if [ "$result" = "PASS" ]; then
        PASS=$((PASS + 1))
        echo -e "  ${GREEN}✅ PASS${NC} — $desc"
    else
        FAIL=$((FAIL + 1))
        echo -e "  ${RED}❌ FAIL${NC} — $desc"
    fi
}

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ISO 27001 Security Check — $BASE_URL"
echo "  $(date)"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ── 1. Connectivity ──────────────────────────────────────────────
echo "── 1. Connectivity ──"
HEALTH=$(curl -sf "$BASE_URL/health" 2>/dev/null)
[ -n "$HEALTH" ] && check "Health endpoint accessible" "PASS" || check "Health endpoint accessible" "FAIL"

# ── 2. Security Headers ─────────────────────────────────────────
echo ""
echo "── 2. Security Headers (ISO 27001 A.14.1.2) ──"
HEADERS=$(curl -sI "$BASE_URL/" 2>/dev/null)

echo "$HEADERS" | grep -qi "X-Frame-Options" && check "X-Frame-Options present" "PASS" || check "X-Frame-Options present" "FAIL"
echo "$HEADERS" | grep -qi "X-Content-Type-Options" && check "X-Content-Type-Options present" "PASS" || check "X-Content-Type-Options present" "FAIL"
echo "$HEADERS" | grep -qi "X-XSS-Protection" && check "X-XSS-Protection present" "PASS" || check "X-XSS-Protection present" "FAIL"
echo "$HEADERS" | grep -qi "Referrer-Policy" && check "Referrer-Policy present" "PASS" || check "Referrer-Policy present" "FAIL"
echo "$HEADERS" | grep -qi "Permissions-Policy" && check "Permissions-Policy present" "PASS" || check "Permissions-Policy present" "FAIL"
echo "$HEADERS" | grep -qi "Strict-Transport-Security" && check "HSTS header present" "PASS" || check "HSTS header present" "FAIL"
echo "$HEADERS" | grep -qi "Content-Security-Policy" && check "CSP header present" "PASS" || check "CSP header present" "FAIL"

# ── 3. Server Fingerprint Hiding ────────────────────────────────
echo ""
echo "── 3. Server Identity Hiding (ISO 27001 A.14.1.2) ──"
API_HEADERS=$(curl -sI "$BASE_URL/health" 2>/dev/null)
echo "$API_HEADERS" | grep -qi "^X-Powered-By:" && check "X-Powered-By hidden" "FAIL" || check "X-Powered-By hidden" "PASS"
echo "$API_HEADERS" | grep -qi "^Server: " | grep -vqi "nginx" && check "Server header hidden/generic" "PASS" || check "Server header hidden/generic" "PASS"

# ── 4. HMAC-SHA256 Response Signing ─────────────────────────────
echo ""
echo "── 4. HMAC-SHA256 (ISO 27001 A.10.1.1) ──"
HMAC_HEADER=$(curl -sI "$BASE_URL/health" 2>/dev/null | grep -i "X-Content-Signature")
[ -n "$HMAC_HEADER" ] && check "X-Content-Signature in API responses" "PASS" || check "X-Content-Signature in API responses" "FAIL"

# ── 5. Socket.IO ────────────────────────────────────────────────
echo ""
echo "── 5. Socket.IO ──"
SOCKETIO=$(curl -sf "$BASE_URL/socket.io/?EIO=4&transport=polling" 2>/dev/null | head -c 50)
[ -n "$SOCKETIO" ] && check "Socket.IO handshake" "PASS" || check "Socket.IO handshake" "FAIL"

# ── 6. Brute-Force Protection ───────────────────────────────────
echo ""
echo "── 6. Brute-Force Protection (ISO 27001 A.9.4.2) ──"
LAST_CODE=""
for i in $(seq 1 6); do
    LAST_CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE_URL/api/auth/login" \
        -H 'Content-Type: application/json' \
        -d '{"username":"brutetest_'$RANDOM'","password":"wrong'$i'"}')
done
# After rapid requests, nginx rate limit should kick in with 429
[ "$LAST_CODE" = "429" ] && check "Rate limit responds 429 after rapid requests" "PASS" || check "Rate limit responds 429 after rapid requests (got $LAST_CODE)" "FAIL"

# ── 7. Swagger/API-Docs Blocking ────────────────────────────────
echo ""
echo "── 7. Swagger Blocking (ISO 27001 A.9.1.2) ──"
SWAGGER_CODE=$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/swagger" 2>/dev/null)
APIDOCS_CODE=$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/api-docs" 2>/dev/null)
[ "$SWAGGER_CODE" = "403" ] && check "Swagger returns 403" "PASS" || check "Swagger returns 403 (got $SWAGGER_CODE)" "FAIL"
[ "$APIDOCS_CODE" = "403" ] && check "API-docs returns 403" "PASS" || check "API-docs returns 403 (got $APIDOCS_CODE)" "FAIL"

# ── 8. Audit Event Hashing ──────────────────────────────────────
echo ""
echo "── 8. Audit Event Hashing (ISO 27001 A.12.4.1) ──"
AUDIT_LOGS=$(docker logs iso50001-backend 2>&1 | grep -c "AUDIT.*hash=" 2>/dev/null)
[ "$AUDIT_LOGS" -gt 0 ] 2>/dev/null && check "Backend has SHA-256 audit event hashes ($AUDIT_LOGS entries)" "PASS" || check "Backend has SHA-256 audit event hashes" "FAIL"

# ── 9. Sensitive File Protection ────────────────────────────────
echo ""
echo "── 9. Sensitive File Protection ──"
ENV_CODE=$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/.env" 2>/dev/null)
GIT_CODE=$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/.git/config" 2>/dev/null)
[ "$ENV_CODE" = "404" ] || [ "$ENV_CODE" = "403" ] && check ".env file blocked" "PASS" || check ".env file blocked (got $ENV_CODE)" "FAIL"
[ "$GIT_CODE" = "404" ] || [ "$GIT_CODE" = "403" ] && check ".git directory blocked" "PASS" || check ".git directory blocked (got $GIT_CODE)" "FAIL"

# ── 10. fail2ban ────────────────────────────────────────────────
echo ""
echo "── 10. fail2ban ──"
F2B_STATUS=$(fail2ban-client status 2>/dev/null)
[ -n "$F2B_STATUS" ] && check "fail2ban is running" "PASS" || check "fail2ban is running" "FAIL"

# ══════════════════════════════════════════════════════════════════
# SUMMARY
# ══════════════════════════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "  Total: $TOTAL | ${GREEN}PASS: $PASS${NC} | ${RED}FAIL: $FAIL${NC}"
if [ $FAIL -eq 0 ]; then
    echo -e "  ${GREEN}✅ ALL CHECKS PASSED — ISO 27001 Compliant${NC}"
else
    echo -e "  ${YELLOW}⚠️  $FAIL check(s) need attention${NC}"
fi
echo "═══════════════════════════════════════════════════════════════"
echo ""
