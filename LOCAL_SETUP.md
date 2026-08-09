# VEONVERSE — Local Setup (no Docker)

This machine runs the stack natively on **dedicated high ports**, so it never
collides with the other projects already using 3000 / 5000 / 5173 / 8000 / 5432.

| Service        | Port      | URL                          |
| -------------- | --------- | ---------------------------- |
| Frontend (Vite)| **15173** | http://localhost:15173       |
| Backend (API)  | **18000** | http://127.0.0.1:18000/docs  |
| Postgres       | **15432** | `localhost:15432/veonverse`  |

The Postgres instance is a **separate cluster** with its own data directory
(`./.pgdata`). Your pre-existing Postgres on 5432 is untouched.

## Start everything

```bash
./scripts/dev.sh
```

Ctrl-C stops the backend and frontend. Postgres stays up; stop it with
`./scripts/db.sh stop`.

## Start pieces individually

```bash
./scripts/db.sh start                  # Postgres on 15432

# Backend — run from the repo root so ./.env resolves
backend/.venv/bin/python -m uvicorn app.main:app \
  --app-dir backend --host 127.0.0.1 --port 18000 \
  --reload --reload-dir backend/app

cd frontend && npm run dev             # Vite on 15173
```

> Use `--reload-dir backend/app`. Plain `--reload` watches the repo root and
> stalls, because it tries to scan `.venv/`, `node_modules/`, and `.pgdata/`.

## Database helpers

```bash
./scripts/db.sh start | stop | status
./scripts/db.sh psql                   # open a SQL shell
./scripts/db.sh reset                  # wipe + re-ingest (destroys XP/progress)
```

Credentials: user `veonverse`, password `veonverse`, database `veonverse`.

## Re-ingesting the vector store

`backend/ingest_all.py` **drops and recreates every table**, then re-embeds all
10 principle files into `leadership_chunks` (40 chunks).

```bash
cd backend && .venv/bin/python ingest_all.py
cd backend && .venv/bin/python test_retrieval.py   # retrieval smoke test
```

## Environment

A single `.env` at the repo root feeds both services — `backend/app/config.py`
resolves it by absolute path, and `frontend/vite.config.js` sets `envDir: ".."`.

**`GROQ_API_KEY` is currently empty.** Everything works without it except the
LLM calls: `POST /mentor/ask` and `POST /lessons/{id}/next` return 500 until you
paste a key from https://console.groq.com/keys into `.env` and restart the
backend. Retrieval, embeddings, principles, progress, and badges all work now.

## Local toolchain notes

- Backend venv is `backend/.venv` (**Python 3.12** — torch has no 3.14 wheels).
- `pgvector` 0.8.0 was compiled from source for PostgreSQL 16; Homebrew's bottle
  only ships for PG 17/18. To rebuild:
  ```bash
  make PG_CONFIG=/opt/homebrew/opt/postgresql@16/bin/pg_config \
       PG_SYSROOT=/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk
  ```
  The `PG_SYSROOT` override is required — `pg_config` points at a
  `MacOSX26.sdk` path that does not exist on this machine.
- Embeddings run locally via `sentence-transformers/all-MiniLM-L6-v2` (384-dim),
  cached under `~/.cache/huggingface`. No API key needed.

## Ports are configurable, not hardcoded

Nothing in the committed code is pinned to this machine's ports. They all come
from the gitignored `.env`:

| Variable            | This machine            | Default if unset        |
| ------------------- | ----------------------- | ----------------------- |
| `VITE_PORT`         | `15173`                 | `5173`                  |
| `VITE_API_BASE_URL` | `http://127.0.0.1:18000`| `http://127.0.0.1:8000` |
| `DATABASE_URL`      | `localhost:15432`       | see `.env.example`      |

The backend port is passed on the uvicorn command line (`--port 18000`), so
anyone cloning the repo gets the standard ports unless they opt out in `.env`.

## Files changed from upstream for local use

- `frontend/vite.config.js` — reads `VITE_PORT` (falls back to 5173), `envDir: ".."`
- `backend/app/config.py` — `.env` resolved by absolute path, not CWD
- `.env.example` — documents `VITE_PORT` and the Anam variables
- `.gitignore` — added `.venv/`, `.pgdata/`, `.pglogs/`
- `scripts/`, `LOCAL_SETUP.md` — new

`docker-compose.yml` is unchanged and still uses the original ports.
