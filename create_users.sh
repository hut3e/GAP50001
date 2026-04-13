#!/bin/bash
# Get Admin Token
ATOKEN=$(curl -s -X POST http://localhost:5002/api/auth/login -H 'Content-Type: application/json' -d '{"username":"hut3e","password":"ToanAntigravity2026!&"}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))")
echo "Admin Token: $ATOKEN"

# Create auditor01
curl -s -X POST http://localhost:5002/api/auth/users \
  -H "Authorization: Bearer $ATOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"username":"auditor01","password":"AuditISO2026!@","role":"auditor","displayName":"Vũ Hải Nam"}'

# Create viewer01
curl -s -X POST http://localhost:5002/api/auth/users \
  -H "Authorization: Bearer $ATOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"username":"viewer01","password":"ViewISO2026!@","role":"viewer"}'
