#!/bin/bash
# ============================================================
#  start-native.sh — ISO 50001 GAP Survey (no Docker)
#  Runs MongoDB + Backend + Frontend directly on macOS
# ============================================================
#
#  Prerequisites (one-time setup):
#    brew install mongodb-community
#    # MongoDB starts automatically as a LaunchDaemon on macOS
#
#  Usage:
#    ./start-native.sh        # Start everything
#    ./start-native.sh stop   # Stop backend + frontend
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
BACKEND_PID_FILE="/tmp/iso50001-backend.pid"
FRONTEND_PID_FILE="/tmp/iso50001-frontend.pid"

MONGODB_URI="${MONGODB_URI:-mongodb://localhost:27017/iso50001gap}"

# ── MongoDB ──────────────────────────────────────────────────
start_mongo() {
  if brew services list 2>/dev/null | grep -q "mongodb-community.*started"; then
    echo "==> MongoDB already running"
  else
    echo "==> Starting MongoDB Community..."
    brew services start mongodb-community
    sleep 3
  fi
  echo "   MongoDB: localhost:27017"
}

# ── Backend ──────────────────────────────────────────────────
start_backend() {
  echo "==> Starting Backend (http://localhost:5002)..."
  cd "$BACKEND_DIR"
  MONGODB_URI="$MONGODB_URI" PORT=5002 node server.js &
  echo $! > "$BACKEND_PID_FILE"
  echo "   Backend PID: $(cat $BACKEND_PID_FILE)"
  sleep 3
}

# ── Frontend ─────────────────────────────────────────────────
start_frontend() {
  echo "==> Starting Frontend (http://localhost:3000)..."
  cd "$FRONTEND_DIR"
  npm run dev &
  echo $! > "$FRONTEND_PID_FILE"
  echo "   Frontend PID: $(cat $FRONTEND_PID_FILE)"
  sleep 3
}

# ── Stop ─────────────────────────────────────────────────────
stop() {
  echo "==> Stopping services..."
  for pidf in "$BACKEND_PID_FILE" "$FRONTEND_PID_FILE"; do
    if [ -f "$pidf" ]; then
      kill "$(cat "$pidf")" 2>/dev/null && echo "   Stopped $(basename "$pidf")" || true
      rm -f "$pidf"
    fi
  done
  echo "✅ All stopped."
}

# ── Main ─────────────────────────────────────────────────────
case "${1:-start}" in
  start)
    start_mongo
    start_backend
    start_frontend
    echo ""
    echo "✅ ISO 50001 GAP Survey running:"
    echo "   App:  http://localhost:3000"
    echo "   API:  http://localhost:5002"
    echo ""
    echo "   Stop: ./start-native.sh stop"
    ;;
  stop)  stop ;;
  *)
    echo "Usage: $0 {start|stop}"
    exit 1
    ;;
esac
