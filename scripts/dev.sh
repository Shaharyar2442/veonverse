#!/usr/bin/env bash
# Start the whole VEONVERSE stack locally on its dedicated ports.
#   Postgres 15432 | Backend 18000 | Frontend 15173
# Ctrl-C stops the backend and frontend; Postgres keeps running
# (stop it with ./scripts/db.sh stop).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

"$ROOT/scripts/db.sh" start >/dev/null 2>&1 || true
/opt/homebrew/opt/postgresql@16/bin/pg_isready -h localhost -p 15432

cd "$ROOT"
backend/.venv/bin/python -m uvicorn app.main:app \
  --app-dir backend --host 127.0.0.1 --port 18000 \
  --reload --reload-dir backend/app &
BACKEND_PID=$!

cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

trap 'kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true' INT TERM EXIT

echo ""
echo "  Frontend  ->  http://localhost:15173"
echo "  Backend   ->  http://127.0.0.1:18000  (docs: /docs)"
echo "  Postgres  ->  localhost:15432"
echo ""

wait
