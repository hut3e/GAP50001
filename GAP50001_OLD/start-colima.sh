#!/bin/bash
# ============================================================
#  start-colima.sh — ISO 50001 GAP Survey via Colima
#  macOS only (no Docker Desktop needed)
# ============================================================
#
#  Prerequisites (one-time setup):
#    brew install colima
#    brew install docker docker-compose
#
#  Usage:
#    ./start-colima.sh        # Start everything
#    ./start-colima.sh stop   # Stop everything
#    ./start-colima.sh logs   # Tail logs
# ============================================================

set -e

cd "$(dirname "$0")"

start() {
  echo "==> Starting Colima..."
  colima start

  echo ""
  echo "==> Building and starting ISO 50001 GAP Survey..."
  docker compose up -d --build

  echo ""
  echo "==> Waiting for MongoDB to be healthy..."
  sleep 5
  docker compose ps

  echo ""
  echo "✅ App ready at: http://localhost:8888"
  echo "   MongoDB:      localhost:27017  (MongoDB Compass)"
  echo ""
  echo "   Stop:         ./start-colima.sh stop"
  echo "   Logs:         ./start-colima.sh logs"
}

stop() {
  echo "==> Stopping ISO 50001 GAP Survey..."
  docker compose down
  echo "✅ Stopped."
}

logs() {
  docker compose logs -f
}

case "${1:-start}" in
  start) start ;;
  stop)  stop ;;
  logs)  logs ;;
  *)
    echo "Usage: $0 {start|stop|logs}"
    exit 1
    ;;
esac
