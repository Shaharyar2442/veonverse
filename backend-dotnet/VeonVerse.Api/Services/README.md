# Services — all the business logic

Everything the application *does* lives here. Controllers only translate HTTP; entities only
describe tables. This folder holds the actual behaviour.

Python equivalent: `backend/app/services/`. Two of those files survive there because the
ingestion script needs them — `bedrock.py` and `retrieval.py`. The rest (`lesson.py`,
`gamification.py`, `news.py`) were deleted with the FastAPI server and live in git history.

---

## The seven services

| Service | Lifetime | Does |
|---|---|---|
| `EmbeddingService` | Singleton | Text → 384-number vector, via a local ONNX model |
| `GroqService` | Scoped | Calls the LLM, demands strict JSON back |
| `RetrievalService` | Scoped | Vector similarity search (the "R" in RAG) |
| `LessonService` | Scoped | The six-step lesson state machine |
| `GamificationService` | Singleton | XP, levels, streaks |
| `NewsService` | Singleton | Cached OpCo news from Google News RSS |

Each has an interface (`IEmbeddingService`, …). Dependency injection binds to the interface,
so any implementation can be swapped — for a test, or for a different provider — without
touching a single caller.

### Why the lifetimes differ, and why it matters

```
Singleton  One instance for the whole process.
           EmbeddingService — the model is 90 MB and slow to load; load it once.
           NewsService      — the cache must be SHARED, or it would never hit.
           GamificationService — pure arithmetic, no state at all.

Scoped     One instance per HTTP request.
           Anything touching the database. The DbContext tracks changes for one
           request and is disposed at the end of it.
```

**This is a real trap, not a formality.** A singleton that depended on a scoped `DbContext`
would capture one request's context and reuse it forever, across every subsequent request —
producing stale reads and cross-request data leaks. Note that `EmbeddingService` takes no
`DbContext`, which is exactly what lets it be a singleton safely.

---

## `EmbeddingService.cs` — the hardest file here

Turns text into the vector used for similarity search.

Python does this in one line (`model.encode(text, normalize_embeddings=True)`). That line
hides three operations, and .NET has no equivalent library, so all three are written out:

```
"How do we communicate clearly?"
        │
   1. TOKENIZE     WordPiece, uncased  →  [101, 2129, 2079, 2057, ...]
        │          LowerCaseBeforeTokenization and RemoveNonSpacingMarks
        │          MUST both be on: the model's vocabulary is lowercase-only,
        │          so "Clarity" without lowercasing becomes an [UNK] token.
        │
   2. RUN MODEL    ONNX Runtime
        │          inputs:  input_ids, attention_mask, token_type_ids
        │          output:  last_hidden_state  [1, tokens, 384]
        │          One vector per TOKEN — not yet a sentence vector.
        │
   3. MEAN POOL    Average across tokens, honouring the attention mask  →  [384]
        │          Must be the mean. Taking the [CLS] token instead is a
        │          common shortcut that yields different numbers and would
        │          silently break retrieval.
        │
   4. L2 NORMALIZE Scale to length exactly 1.0
        ↓          Makes cosine distance and dot product agree, which is what
   [0.080365, ...] makes scores comparable with Python's.
```

**Why the precision matters so much.** The 40 stored vectors were produced by Python. A
search compares a fresh query vector against them. If this code produced even slightly
different numbers, retrieval would return subtly wrong passages — with **no exception and no
error log**, just quietly worse answers. This has been verified as an exact match to six
decimal places (see the main [README](../../README.md#8-verification-proof-the-port-is-faithful)).

Max sequence length is 256 tokens, matching the model's `max_seq_length`; longer text is
truncated, as in Python.

---

## `GroqService.cs` — talking to the language model

Python equivalent: `BedrockService.converse_structured()`. Note the Python file is called
`bedrock.py` but talks to Groq, not AWS Bedrock — the name is historical and misleading, so
it was dropped here.

**Getting reliable JSON out of a language model takes three layers**, because models will
happily return prose when asked for JSON:

1. `response_format: {"type": "json_object"}` — constrains decoding at the API level
2. The schema is restated inside the prompt, with "do not include markdown fences"
   (otherwise models wrap output in ` ```json `)
3. The four required keys are verified after parsing; a miss throws

**Retries** cover 429 and 5xx with exponential backoff (1s, 2s, 4s, 8s), matching Python's
`RETRYABLE_STATUS_CODES`. A **400 or 404 is not retried** — those mean the request or model
id is wrong, and repeating an invalid request just wastes time. A 404 gets a specific error
message, because it almost always means `GROQ_MODEL_ID` names a model Groq has retired.

`options` is read from the JSON tree by hand rather than deserialized automatically, because
it is genuinely polymorphic: an array of strings at the intro step, `null` everywhere else.

---

## `RetrievalService.cs` — vector search

The "R" in RAG. Embed the question, ask PostgreSQL for the closest stored passages.

```csharp
.OrderBy(chunk => chunk.Embedding.CosineDistance(queryVector))
.Take(4)
```

EF Core translates `.CosineDistance()` into pgvector's `<=>` operator:

```sql
SELECT ... FROM leadership_chunks
WHERE principle_id = $1
ORDER BY embedding <=> $2
LIMIT 4
```

**The comparison happens inside PostgreSQL.** The obvious alternative — load every chunk and
compare in C# — works fine at 40 rows and collapses at 40,000, and can never use a vector
index.

**Distance vs score.** pgvector returns *distance* (0 = identical, 2 = opposite). The API
reports a *score* (1 = identical) via `1 - distance`, clamped at zero — the same conversion
Python does, so the numbers are comparable across both stacks.

---

## `LessonService.cs` — the six-step state machine

The biggest file here, and the heart of the product.

**The state lives in the database**, on `UserProgress.CurrentStep`. The client never says
which step it wants; it POSTs "next" plus any answer, and the server runs whatever is due.
Refreshing the page resumes correctly, and a client cannot skip ahead.

```
  intro  ──────────────►  4 options offered
    │
    │ requires input (the chosen option)
    ▼
  discussion  ─────────►  reacts to the choice
    │
    ▼
  official_principle ──►  RAG-grounded explanation      ← retrieval
    │
    ▼
  examples  ───────────►  RAG-grounded examples         ← retrieval
    │
    ▼
  reflection  ─────────►  ① asks the question  (no input → stays on this step)
    │                     ② accepts the answer, awards 100 XP + badge
    ▼
  completion  ─────────►  terminal, repeatable forever
```

**Only two steps use retrieval** — `official_principle` and `examples`. Those must stay
faithful to source material. The others are conversational, where grounding would add cost
without value.

**`reflection` is the only step that runs twice.** First call asks the question and
deliberately leaves `CurrentStep` unchanged, so the next call lands here again. Second call
(with input) awards XP, grants the badge and advances. It is the only place XP is paid.

**Failure is soft.** `RunStructuredCallAsync` catches everything and falls back to canned
mentor text. If Groq is down, rate-limited, or unconfigured, the learner keeps going instead
of hitting a 500. The failure is logged, so it is visible to operators even while invisible
to the learner.

> This is the opposite of `/mentor/ask`, which has **no** fallback — see
> [`../Controllers/README.md`](../Controllers/README.md) for why those two differ.

**Badge awards are idempotent.** The code checks for an existing `UserBadge` before
inserting, so replaying a completed lesson cannot farm duplicates. Verified.

**One sharp edge, inherited from Python:** if the model returns other than exactly four
options at the intro step, the request throws. The UI renders exactly four buttons, so
anything else is unusable — and the fallback path always supplies four.

---

## `GamificationService.cs` — XP, levels, streaks

Pure arithmetic. No database access of its own — it mutates the `User` object in place and
lets the caller decide when to save. That keeps the rules trivially testable and lets an XP
award commit in the same transaction as the progress update it accompanies.

- **Level** = `1 + (xp / 100)`, minimum 1. So 0-99 XP is level 1, 100-199 is level 2.
- **XP to next level** = `(level × 100) - xp`. At 250 XP: level 3, next at 300, so 50 to go.
- **Streak** has three cases:
  - already active today → return immediately (a streak counts *days*, not sessions)
  - last active yesterday → increment
  - anything older, or never → reset to 1

Dates are compared as `"yyyy-MM-dd"` strings in server-local time, matching Python's
`date.today().isoformat()` exactly, so both stacks agree on when a day rolls over.

---

## `NewsService.cs` — live OpCo news

Pulls each operating company's latest coverage from Google News' public RSS search. No API
key needed.

Three things make it well-behaved:

- **Caching (30 min)** — otherwise every hub page load fires seven outbound requests, which
  is both slow and a good way to get rate-limited.
- **Parallel fetching** — all seven feeds at once via `Task.WhenAll`, so a refresh costs
  roughly the slowest single request rather than the sum of all seven.
- **Failure isolation** — a broken feed returns an empty list rather than throwing, so one
  unreachable company cannot blank the whole section.

**Interleaving** matters more than it sounds: results are ordered as "every company's top
story, then every company's second", rather than three from one company in a row. Without
it the first few cards all belong to one company, which reads as a bug even though the data
is correct.

The cache is guarded by a `SemaphoreSlim` rather than a `lock`, because the refresh it
protects is asynchronous and you cannot `await` inside a `lock` statement.

---

## How they depend on each other

```
LessonService
   ├── IGroqService          (generate text)
   ├── IRetrievalService     (steps 3 and 4 only)
   │      └── IEmbeddingService
   ├── IGamificationService  (award XP)
   └── VeonVerseDbContext    (read and write progress)

MentorController
   ├── IRetrievalService  →  IEmbeddingService
   ├── IGroqService
   └── VeonVerseDbContext

StoriesController
   └── INewsService          (standalone — touches nothing else)
```

`NewsService` is entirely independent: no database, no model, no LLM.
