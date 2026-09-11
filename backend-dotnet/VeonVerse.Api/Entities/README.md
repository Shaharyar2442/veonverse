# Entities — the database tables

Each class here describes one table. These are the .NET equivalent of the SQLAlchemy models
in [`../../../backend/app/models.py`](../../../backend/app/models.py).

An entity is a **plain C# class with no behaviour** — no methods, no validation, no logic.
Its only job is to say "this table has these columns of these types". Everything that
*does* something lives in [`../Services/`](../Services/).

> **Entities are not the API.** The shapes the HTTP API sends and receives live in
> [`../Dtos/`](../Dtos/). Keeping them separate means the database schema and the wire
> format can change independently — and it stops internal columns leaking to clients by
> accident.

---

## The seven tables

```
principles ──────┐
   (10 rows)     │
                 │
badges ──────────┼──── user_progress ────── users
   (10 rows)     │      (per user,           (demo user, id 1)
                 │       per principle)          │
leadership_chunks│                               │
   (40 rows)     └──── user_badges ──────────────┤
   vectors                                       │
                       chat_messages ────────────┘
                         (audit log)
```

---

## File by file

### `Principle.cs` → table `principles`

The ten leadership principles. Seeded at startup, never modified at runtime.

| Property | Column | Notes |
|---|---|---|
| `Id` | `id` | 1-10, assigned explicitly so badge ids can match |
| `Number` | `number` | Display order. Separate from `Id` so principles could be reordered |
| `Title` | `title` | e.g. "Clarity is Our Superpower" |
| `OfficialText` | `official_text` | The formal wording, shown verbatim |
| `Summary` | `summary` | One-line plain-language gloss |
| `PsychometricTension` | `psychometric_tension` | The competing pull, e.g. "Simplification vs. Comprehensiveness" — fed into the intro prompt |
| `HoganCompetencies` | `hogan_competencies` | Assessment competencies — fed into the discussion prompt |
| `BehavioralDomains` | `behavioral_domains` | e.g. "Interpersonal / Leadership" |

### `User.cs` → table `users`

A learner. **There is no authentication anywhere in this codebase** — the user id arrives as
a plain request parameter, and a single demo user (id 1, "Leader Candidate") is seeded at
startup. Anyone can read or modify anyone's progress by changing a number in the URL. That
is acceptable for a local training demo and must not be deployed as-is.

| Property | Column | Notes |
|---|---|---|
| `Xp` | `xp` | Total experience points |
| `Level` | `level` | Derived from XP (100 per level), stored to avoid recomputing |
| `StreakCount` | `streak_count` | Consecutive active days |
| `LastActiveDay` | `last_active_day` | ISO date **string** (`"2026-09-11"`), not a date type — matching the Python column so both stacks read the same values |

### `UserProgress.cs` → table `user_progress`

**The most important entity in the app.** This row is the lesson state machine's memory.

Composite primary key: `(UserId, PrincipleId)` — one row per learner per principle.

| Property | Column | Notes |
|---|---|---|
| `Status` | `status` | `not_started` · `in_progress` · `completed` |
| `CurrentStep` | `current_step` | **The state machine's position.** Always the step that runs *next* |
| `ChosenScenarioAnswer` | `chosen_scenario_answer` | Which of the four intro options was picked |
| `ReflectionResponse` | `reflection_response` | The learner's written reflection |
| `CompletedAt` | `completed_at` | Set once, when the reflection is submitted |

`CurrentStep` is why the lesson resumes correctly after a refresh, and why a client cannot
skip steps: the server reads this column to decide what to do, and ignores any client
opinion on the matter.

### `Badge.cs` → table `badges`

One award per principle. **Badge ids deliberately mirror principle ids** — `LessonService`
finds the badge for principle N by fetching badge N directly. Keep the two ranges aligned or
that lookup silently finds nothing.

### `UserBadge.cs` → table `user_badges`

Join row: this user earned this badge at this time. Composite key `(UserId, BadgeId)`.

That composite key is what makes badge awards **idempotent** — inserting a duplicate would
violate the primary key, so `LessonService` checks for an existing row first. Replaying a
finished lesson cannot farm duplicate badges.

### `ChatMessage.cs` → table `chat_messages`

An append-only audit log of every conversational turn, from both sides.

| Property | Column | Notes |
|---|---|---|
| `Role` | `role` | `user` or `assistant` |
| `Content` | `content` | The message text |
| `RetrievedChunkIds` | `retrieved_chunk_ids` | JSON array of chunk ids — **the receipts** |
| `CreatedAt` | `created_at` | |

Nothing reads this table back yet. It exists so that any past answer's grounding can be
audited after the fact: given an answer, you can see exactly which source passages the model
was shown. That is why the chunk ids are stored alongside the text rather than discarded.

### `LeadershipChunk.cs` → table `leadership_chunks`

The RAG corpus: 40 rows, four passages for each of the ten principles.

| Property | Column | Notes |
|---|---|---|
| `ChunkText` | `chunk_text` | The passage, pasted into prompts as grounding |
| `Embedding` | `embedding` | **`vector(384)`** — a pgvector column, typed as `Pgvector.Vector` |
| `PrincipleId` | `principle_id` | Indexed, because every search filters on it |
| `ChunkType` | `chunk_type` | `definition` · `psychometric_tension` · `coaching_examples` … |
| `SourceUrl` | `source_url` | Provenance |

**This table is written by Python, read by .NET.** The 40 rows come from
[`../../../backend/ingest_all.py`](../../../backend/ingest_all.py), because creating them
means embedding source documents. The .NET app only queries them.

That read-only relationship is precisely why `EmbeddingService` goes to such lengths to
reproduce sentence-transformers exactly — its query vectors are compared against vectors
Python produced, so the two must agree numerically.

---

## Things worth knowing

**Column names are mapped by hand.** These tables use snake_case (`official_text`), while
C# uses PascalCase. EF Core would default to the C# names and fail to find the columns, so
every mapping is spelled out in [`../Data/VeonVerseDbContext.cs`](../Data/VeonVerseDbContext.cs).
A wrong mapping fails at *runtime*, not compile time — if you add a column, add its mapping.

**Navigation properties** (`UserProgress.User`, `UserBadge.Badge`) let EF Core build joins.
The Python version had no relationships configured and queried each table separately.

**Nullability is meaningful.** `string?` means the column is genuinely nullable;
`string` means it is `NOT NULL`. The compiler enforces the distinction, which catches a
whole category of null-reference bug before the code ever runs.
