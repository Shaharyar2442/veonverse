# VEONVERSE Backend — .NET Edition

**This is the VEONVERSE API.** It began as a port of a Python/FastAPI backend and is now the
only HTTP server in the project.

[`../backend/`](../backend/) still exists but has been **stripped to ingestion only** — it
holds `ingest_all.py` and the handful of modules that script needs to embed the principle
documents into the `leadership_chunks` table. It no longer serves HTTP.

> **On the "Python equivalent" comments.** Nearly every file here names the Python function
> or class it was ported from. Those files were removed when the FastAPI server was retired,
> so the references are historical provenance, not live links — the originals are in git
> history (`git show HEAD:backend/app/main.py`). They are kept because knowing *what a piece
> of code was translated from* explains a lot of its shape.

---

## Table of contents

1. [What this is and why it exists](#1-what-this-is-and-why-it-exists)
2. [What the application actually does](#2-what-the-application-actually-does)
3. [Running it](#3-running-it)
4. [Project layout](#4-project-layout)
5. [How a request flows through the code](#5-how-a-request-flows-through-the-code)
6. [Python → C# translation guide](#6-python--c-translation-guide)
7. [The three hard parts](#7-the-three-hard-parts)
8. [Verification: proof the port is faithful](#8-verification-proof-the-port-is-faithful)
9. [Configuration reference](#9-configuration-reference)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. What this is and why it exists

The same application, moved from one stack to another:

| | Was (Python, removed) | Is now (.NET) |
|---|---|---|
| Framework | FastAPI | ASP.NET Core 10 (controllers) |
| Database access | SQLAlchemy | Entity Framework Core 10 |
| Validation / shapes | Pydantic | C# `record` types |
| Embeddings | sentence-transformers | ONNX Runtime + Microsoft.ML.Tokenizers |
| Vector search | pgvector via SQLAlchemy | pgvector via `Pgvector.EntityFrameworkCore` |
| API docs | `/docs` (automatic) | `/docs` (Swagger UI) |
| Port | 18000 | **18001** |

It reads the shared repo-root `.env` and the same PostgreSQL database the ingestion script
writes to.

While both backends still existed they were run side by side and compared response for
response — that evidence is recorded in
[section 8](#8-verification-proof-the-port-is-faithful). Reproducing it now would mean
restoring the FastAPI server from git history first.

---

## 2. What the application actually does

Before reading any code, understand the product. It is a **leadership training app** built
around ten VEON leadership principles, with three distinct capabilities:

### a. A guided six-step lesson

For each principle, an AI "mentor avatar" walks a learner through six steps:

```
1. intro               Tells a story about the principle's central tension.
                       Offers exactly 4 possible actions.
                              ↓  learner picks one
2. discussion          Reacts to the choice, ties it to Hogan competencies.
                              ↓
3. official_principle  Explains the formal principle.        ← grounded in real source text
                              ↓
4. examples            2-3 concrete workplace examples.      ← grounded in real source text
                              ↓
5. reflection          Asks how they'll apply it this week.
                              ↓  learner writes an answer
                       Awards 100 XP + a badge.
                              ↓
6. completion          Closing encouragement. Repeatable forever.
```

The crucial design point: **the server owns the position in this sequence, not the client.**
The current step lives in the `user_progress` database row. The client only ever POSTs
"next" plus whatever the learner typed. This means refreshing the browser resumes exactly
where you were, and a client cannot skip to the end to farm XP.

### b. RAG — grounded question answering

"RAG" is Retrieval-Augmented Generation. Rather than trusting a language model to remember
VEON's leadership material, the app looks the material up first and hands it to the model:

```
Question: "When should a leader use radical candor?"
   │
   ├─ 1. RETRIEVE  Convert the question to a 384-number vector,
   │               ask PostgreSQL for the 4 stored passages whose
   │               vectors sit closest to it.
   │
   ├─ 2. AUGMENT   Paste those 4 passages into the prompt, with the
   │               instruction: answer using ONLY this context.
   │
   ├─ 3. GENERATE  Send to Groq, get a structured JSON answer.
   │
   └─ 4. CITE      Return the passage ids alongside the answer, so
                   any claim can be checked against its source.
```

Steps 3 and 4 of the lesson use the same mechanism, which is why they stay faithful to the
official wording instead of improvising.

### c. Gamification and live news

XP (100 per principle), levels (100 XP each), daily streaks, and one badge per principle.
Plus a `/stories` feed pulling live news for each VEON operating company from Google News
RSS, cached for 30 minutes.

---

## 3. Running it

### Prerequisites

- **.NET SDK 10** — `dotnet --version` should print `10.x`
- **PostgreSQL with the pgvector extension**, already running on port 15432
- **A populated database** — the 40 embedded passages must exist (see below)
- **`.env` at the repo root** — shared with the Python backend

### One-time: make sure the vector data exists

This .NET app **reads** the embedded passages; it does not create them. Ingestion still
belongs to the Python script, because producing the vectors means embedding source documents.

```bash
cd ../backend && .venv/bin/python ingest_all.py    # writes 40 chunks
```

Check it worked:

```bash
PGPASSWORD=veonverse /opt/homebrew/opt/postgresql@16/bin/psql \
  -h localhost -p 15432 -U veonverse -d veonverse \
  -c "SELECT count(*) FROM leadership_chunks;"      # expect 40
```

### One-time: the embedding model files

Two files must sit in `VeonVerse.Api/Models_Onnx/`. They are ~90 MB and deliberately
**git-ignored**, so a fresh clone needs to fetch them:

```bash
cd VeonVerse.Api/Models_Onnx
curl -L -o model.onnx https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/main/onnx/model.onnx
curl -L -o vocab.txt  https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/main/vocab.txt
```

The app refuses to start without them, with a message pointing back here.

### Run

```bash
cd VeonVerse.Api
dotnet run
```

| | |
|---|---|
| API | <http://localhost:18001> |
| Swagger UI | <http://localhost:18001/docs> |
| Health | <http://localhost:18001/health> |

Port 18001 is set in `Properties/launchSettings.json`. It was chosen as one above the old
Python backend's 18000 so the two could run at the same time during the port.

Or start everything — Postgres, API and frontend — with `../scripts/dev.sh`.

### The frontend

The repo-root `.env` already points at this API:

```
VITE_API_BASE_URL=http://127.0.0.1:18001
```

**No frontend code changes were needed** for the switch — the JSON this API emits is
identical to what FastAPI produced, down to the snake_case field names.

---

## 4. Project layout

Every folder has its own README going through its files one by one.

```
backend-dotnet/
├── README.md                      ← you are here
├── VeonVerse.sln
└── VeonVerse.Api/
    ├── Program.cs                 Startup: config, DI registration, pipeline, seeding
    ├── appsettings.json           Default settings (.env overrides these)
    ├── Models_Onnx/               The embedding model (git-ignored, ~90 MB)
    │
    ├── Configuration/  → README   Settings, .env loader, connection-string translator
    ├── Entities/       → README   Database table shapes (7 tables)
    ├── Data/           → README   DbContext + seeder
    ├── Dtos/           → README   Request/response shapes crossing the wire
    ├── Services/       → README   All the business logic
    └── Controllers/    → README   HTTP endpoints
```

**The dependency direction is strictly one-way**, which is what keeps it navigable:

```
Controllers  →  Services  →  Data  →  Entities
     ↓             ↓
    Dtos      Configuration
```

Controllers never touch ONNX. Entities never know HTTP exists.

---

## 5. How a request flows through the code

Trace `POST /mentor/ask` — it exercises nearly everything:

```
1.  HTTP POST arrives at :18001/mentor/ask
         │
2.  ASP.NET routing → MentorController.AskMentor()
    Controllers/MentorController.cs
         │   Dependency injection has already supplied a DbContext,
         │   IRetrievalService and IGroqService.
         │
3.  Verify the user exists                          → 404 if not
         │
4.  RetrievalService.RetrieveContextAsync()
    Services/RetrievalService.cs
         │
         ├─ 4a. EmbeddingService.EmbedText(question)
         │      Services/EmbeddingService.cs
         │        · tokenize with WordPiece        → [101, 2129, ...]
         │        · run the ONNX model             → 1 vector per token
         │        · mean-pool across tokens        → 1 vector
         │        · L2 normalize                   → 384 floats, length 1.0
         │
         └─ 4b. EF Core query with .CosineDistance()
                translated to SQL:  ORDER BY embedding <=> $1 LIMIT 4
                PostgreSQL + pgvector does the comparison, returns 4 rows
         │
5.  Build the prompt with those 4 passages pasted in
         │
6.  GroqService.ConverseStructuredAsync()
    Services/GroqService.cs
         │   POST to Groq with response_format=json_object
         │   Retry 429/5xx with backoff · validate the 4 required keys
         │
7.  Write both chat turns to the database, with the chunk ids attached
         │
8.  Return MentorAskResponse
    Dtos/MentorDtos.cs
         │   Serialized to snake_case by the policy set in Program.cs
         ↓
    {"step":"mentor_ask","text":"...","options":null,
     "avatar_state":"...","sources":["22","21","24","23"]}
```

---

## 6. Python → C# translation guide

If you know the Python version, this table is the map.

### Files

Rows marked **†** were deleted when the FastAPI server was retired; they are listed because
the C# files still carry "Python equivalent" comments naming them. The ones without a dagger
still exist in [`../backend/`](../backend/), because `ingest_all.py` needs them.

| Python | C# | Notes |
|---|---|---|
| `app/main.py` **†** | `Program.cs` + `Controllers/*` | Routes split into one controller per resource |
| `app/config.py` | `Configuration/VeonVerseOptions.cs` | Plus a `.env` loader .NET lacks natively |
| `app/database.py` | `Data/VeonVerseDbContext.cs` | |
| `app/models.py` | `Entities/*.cs` | One file per table |
| `app/schemas.py` **†** | `Dtos/*.cs` | Pydantic models → `record` types |
| `app/seed.py` | `Data/DatabaseSeeder.cs` | |
| `app/services/bedrock.py` | `Services/GroqService.cs` + `EmbeddingService.cs` | Split: it did two unrelated jobs |
| `app/services/retrieval.py` | `Services/RetrievalService.cs` | |
| `app/services/lesson.py` **†** | `Services/LessonService.cs` | |
| `app/services/gamification.py` **†** | `Services/GamificationService.cs` | |
| `app/services/news.py` **†** | `Services/NewsService.cs` | |

### Concepts

| Python / FastAPI | C# / ASP.NET Core |
|---|---|
| `@app.get("/principles")` | `[HttpGet]` on a controller method |
| `Depends(get_db)` | Constructor injection of `VeonVerseDbContext` |
| `class Item(BaseModel)` | `public record Item(...)` |
| `raise HTTPException(404)` | `return NotFound(...)` |
| `db.execute(select(X))` | `_dbContext.Xs.Where(...).ToListAsync()` |
| `db.commit()` | `await _dbContext.SaveChangesAsync()` |
| `async def` / `await` | `async Task<T>` / `await` |
| `dict` | `record` or anonymous type |
| `Optional[str]` / `str \| None` | `string?` |
| `lifespan` | The startup block at the end of `Program.cs` |
| `pydantic-settings` reading `.env` | `DotEnvLoader` + `VeonVerseOptions` |

### Two deliberate structural changes

**1. `bedrock.py` was split in two.** That one Python class did two entirely unrelated
things: call a remote LLM over HTTP, and run a local embedding model. They have different
dependencies, different failure modes, and different lifetimes. They are now
`GroqService` and `EmbeddingService`. (The name "bedrock" was already misleading — nothing
in it touches AWS Bedrock.)

**2. Every service has an interface.** `ILessonService`, `IRetrievalService` and so on.
This is what dependency injection binds to, and it means any piece can be swapped for a
test double without touching its callers.

### One deliberate default change

`max_tokens` for LLM calls is **1500**, where Python used 700. Reasoning models — including
the `openai/gpt-oss-*` family currently configured — spend tokens thinking before emitting
their answer, and that budget counts against the same limit. At 700 the JSON can be cut off
mid-string and fail to parse. This is a default, not a rule: pass `maxTokens` explicitly to
override it.

---

## 7. The three hard parts

Most of this port is mechanical. Three things were not, and they are where the real
complexity lives.

### 7.1 Embeddings — reproducing sentence-transformers exactly

**The problem.** Python does this in one line:

```python
model.encode(text, normalize_embeddings=True)
```

That single call hides three separate operations, and .NET has no equivalent library. If
the .NET output differed *even slightly* from Python's, retrieval would silently degrade —
no exception, no error log, just subtly wrong passages feeding every answer. Silent
correctness bugs are the worst kind.

**Why it must match.** The 40 vectors in `leadership_chunks` were produced by Python. A
search compares a fresh query vector against those stored vectors. Both must live in the
same geometric space or the comparison is meaningless.

**The solution** — `Services/EmbeddingService.cs` spells out all three steps:

```
"How do we communicate clearly?"
        │
   1. TOKENIZE  (Microsoft.ML.Tokenizers, WordPiece, uncased)
        │       [101, 2129, 2079, 2057, 10639, 4415, 1029, 102]
        │       Must lowercase and strip accents — the model's vocabulary
        │       is lowercase-only, so getting this wrong yields [UNK] tokens.
        │
   2. RUN MODEL  (ONNX Runtime)
        │       → last_hidden_state: [1, 8, 384]
        │       One 384-number vector per token. Not what we want yet.
        │
   3. MEAN POOL
        │       Average across the 8 token vectors → [384]
        │       Must be the *mean*, honouring the attention mask.
        │       Using the [CLS] token instead — a common shortcut —
        │       produces different numbers and breaks everything.
        │
   4. L2 NORMALIZE
        │       Scale to length exactly 1.0.
        ↓
   [0.080365, 0.091089, 0.023030, ...]
```

**Verified identical.** See [section 8](#8-verification-proof-the-port-is-faithful).

### 7.2 Vector search through EF Core

pgvector adds a `<=>` operator for cosine distance. `Pgvector.EntityFrameworkCore` exposes
it as `.CosineDistance()`, which EF Core translates into SQL:

```csharp
.OrderBy(chunk => chunk.Embedding.CosineDistance(queryVector))
.Take(4)
```

becomes

```sql
SELECT ... FROM leadership_chunks
WHERE principle_id = $1
ORDER BY embedding <=> $2
LIMIT 4
```

The comparison happens **inside PostgreSQL**. Loading all rows and comparing in C# would
work at 40 rows and fall over at 40,000, and could never use a vector index.

One conversion to remember: pgvector returns **distance** (0 = identical), the API reports
**score** (1 = identical), via `1 - distance` clamped at zero.

### 7.3 snake_case JSON

FastAPI emits `official_text`. C# properties are `OfficialText`. Left alone, the .NET API
would emit `officialText` and the React frontend would read `undefined` everywhere — with
no error, just blank fields.

One line in `Program.cs` fixes it globally:

```csharp
jsonOptions.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
```

This is why the frontend works against either backend with no code change at all.

---

## 8. Verification: proof the port is faithful

Claims of "identical behaviour" are worth nothing unmeasured. Here is what was actually
checked, with both backends running at once.

### Embeddings — exact numeric match

The same three strings through both implementations:

| Input | Python (first 4 dims) | .NET (first 4 dims) |
|---|---|---|
| "How do we simplify complex data…" | `0.080365, 0.091089, 0.023030, 0.017282` | `0.080365, 0.091089, 0.023030, 0.017282` |
| "Courage Fuels Our Leadership" | `-0.005994, 0.067243, -0.005972, 0.018934` | `-0.005994, 0.067243, -0.005972, 0.018934` |
| "short" | `0.016769, 0.106482, 0.019996, 0.046916` | `0.016769, 0.106482, 0.019996, 0.046916` |

**Identical to six decimal places.** All vectors 384-dimensional with magnitude 1.000000.

### Retrieval — identical ranking

Same question to both backends, comparing which passages come back and in what order:

| Question | Python | .NET |
|---|---|---|
| "How do we simplify complex data…" | `24, 23, 21, 22` | `24, 23, 21, 22` |
| "When should a leader use radical candor?" | `22, 21, 24, 23` | `22, 21, 24, 23` |
| "Why must we never compromise integrity?" | `22, 23, 24, 21` | `22, 23, 24, 21` |

### JSON — byte-identical

`/principles`, `/principles/1` and `/users/1/progress` were fetched from both, sorted and
diffed: **no differences**.

### Status codes — matched, including error paths

| Endpoint | Python | .NET |
|---|---|---|
| `/`, `/health`, `/principles`, `/principles/1` | 200 | 200 |
| `/principles/999` (missing) | 404 | 404 |
| `/users/1/progress`, `/users/1/badges` | 200 | 200 |
| `/users/999/progress` (missing) | 404 | 404 |
| `/lessons/1/next` with required input omitted | 400 | 400 |

### Lesson flow — full six-step walkthrough

Principle 7 run end to end on the .NET backend:

```
step=intro               1/6  xp=0    avatar=Presenting Story        options: 4
step=discussion          2/6  xp=0    avatar=Coaching & Feedback
step=official_principle  3/6  xp=0    avatar=Explaining Principle    ← RAG
step=examples            4/6  xp=0    avatar=Sharing Real Examples   ← RAG
step=reflection          5/6  xp=0    avatar=Listening to Employee
step=completion          6/6  xp=100  avatar=Celebrating Achievement ← XP awarded
```

Afterwards: badge 7 "Moonshot Architect" granted, XP 100, level 2, progress `completed`.

**Idempotency:** replaying the completion step twice left XP at 100 and the badge count at
1 — no double-award.

### One bug found and fixed during verification

`/users/{id}/badges` returned **500**, while Python returned 200. EF Core could not
translate `OrderByDescending` reading a property off a record being constructed in the same
query. Fixed by ordering on the joined row *before* projecting into `BadgeItem` — see the
comment in `Controllers/UsersController.cs`. This is exactly the class of bug the
side-by-side comparison exists to catch.

---

## 9. Configuration reference

All settings come from the **repo-root `.env`**, shared with the Python backend. Precedence,
lowest to highest: `appsettings.json` → `.env` → real environment variables.

| Key | Default | What it does |
|---|---|---|
| `GROQ_API_KEY` | *(empty)* | Groq key. Empty → lessons fall back to canned text; `/mentor/ask` fails. |
| `GROQ_MODEL_ID` | `openai/gpt-oss-120b` | Must support `json_object` response format. |
| `DATABASE_URL` | `…@localhost:15432/veonverse` | SQLAlchemy URL form is accepted and translated. |
| `EMBEDDING_DIMENSION` | `384` | Must stay 384 unless you change models *and* re-ingest. |
| `LOCAL_EMBEDDING_MODEL` | `sentence-transformers/all-MiniLM-L6-v2` | Informational — records which model made the vectors. |
| `DEFAULT_PRINCIPLE_ID` | `1` | Used by `/mentor/ask` when the caller names no principle. |
| `LESSON_XP_REWARD` | `100` | XP per completed principle. |

---

## 10. Troubleshooting

**`Embedding model files missing`**
`model.onnx` or `vocab.txt` is absent from `VeonVerse.Api/Models_Onnx/`. Re-run the two
`curl` commands in [section 3](#3-running-it).

**`Database preparation failed`**
PostgreSQL is not running, or `DATABASE_URL` is wrong. Start it with
`../scripts/db.sh start` and confirm the port is 15432.

**`404` from Groq, surfaced as a 500 on `/mentor/ask`**
`GROQ_MODEL_ID` names a retired model. Groq decommissions models regularly. List what your
key can currently use:

```bash
curl -s https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer $GROQ_API_KEY" | python3 -m json.tool | grep '"id"'
```

The error message from `GroqService` says this explicitly when it sees a 404.

**Frontend shows blank fields**
The JSON naming policy is not applying. Confirm `PropertyNamingPolicy` is still
`SnakeCaseLower` in `Program.cs`, and check the raw response:
`curl -s localhost:18001/principles/1` should show `official_text`, not `officialText`.

**Retrieval returns odd passages**
Confirm `leadership_chunks` has 40 rows. If the table is empty, `/mentor/ask` will return
ungrounded answers. Re-run `../backend/ingest_all.py`.

**Port 18001 already in use**
Change `applicationUrl` in `VeonVerse.Api/Properties/launchSettings.json`.
