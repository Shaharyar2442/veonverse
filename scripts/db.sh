#!/usr/bin/env bash
# Control the isolated VEONVERSE Postgres cluster (port 15432).
# Usage: ./scripts/db.sh start | stop | status | psql | reset
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PGBIN="/opt/homebrew/opt/postgresql@16/bin"
PGDATA="$ROOT/.pgdata"
PGLOG="$ROOT/.pglogs/postgres.log"
PORT=15432

case "${1:-status}" in
  start)
    mkdir -p "$ROOT/.pglogs"
    "$PGBIN/pg_ctl" -D "$PGDATA" -l "$PGLOG" start
    sleep 1
    "$PGBIN/pg_isready" -h localhost -p "$PORT"
    ;;
  stop)
    "$PGBIN/pg_ctl" -D "$PGDATA" stop -m fast
    ;;
  status)
    "$PGBIN/pg_isready" -h localhost -p "$PORT" || true
    "$PGBIN/pg_ctl" -D "$PGDATA" status || true
    ;;
  psql)
    PGPASSWORD=veonverse "$PGBIN/psql" -h localhost -p "$PORT" -U veonverse -d veonverse
    ;;
  reset)
    # Drops and re-ingests every table. Destroys all local progress/XP data.
    read -r -p "Wipe the veonverse database and re-ingest? [y/N] " reply
    [[ "$reply" == "y" || "$reply" == "Y" ]] || { echo "Aborted."; exit 1; }
    cd "$ROOT/backend" && .venv/bin/python ingest_all.py
    ;;
  *)
    echo "Usage: $0 {start|stop|status|psql|reset}" >&2
    exit 1
    ;;
esac
