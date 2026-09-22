#!/usr/bin/env bash
# Start the whole VEONVERSE stack locally on its dedicated ports.
#   Postgres 15432 | Backend (.NET) 18001 | Frontend 15173
# Ctrl-C stops the backend and frontend; Postgres keeps running
# (stop it with ./scripts/db.sh stop).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

"$ROOT/scripts/db.sh" start >/dev/null 2>&1 || true
/opt/homebrew/opt/postgresql@16/bin/pg_isready -h localhost -p 15432

# The API is the ASP.NET Core project in backend-dotnet/ (port 18001, set in
# VeonVerse.Api/Properties/launchSettings.json). The Python backend in backend/
# is unchanged and can still be run by hand — see LOCAL_SETUP.md.
cd "$ROOT/backend-dotnet/VeonVerse.Api"
dotnet run &
BACKEND_PID=$!

cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

trap 'kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true' INT TERM EXIT

echo ""
echo "  Frontend  ->  http://localhost:15173"
echo "  Backend   ->  http://localhost:18001  (docs: /docs)"
echo "  Postgres  ->  localhost:15432"
echo ""

wait
