# Data — database context and seeding

Two files: one describing how C# classes map to PostgreSQL tables, one putting the starting
rows in place.

Python equivalent: [`../../../backend/app/database.py`](../../../backend/app/database.py)
and [`../../../backend/app/seed.py`](../../../backend/app/seed.py).

---

## `VeonVerseDbContext.cs`

The Entity Framework Core context — the .NET counterpart of SQLAlchemy's `Base` and
`SessionLocal`. It does two jobs:

1. Exposes a `DbSet<T>` per table, which is what you write LINQ queries against
2. Declares exactly how each C# property maps to a database column

### Every column is mapped by hand — and it has to be

The tables were created by the Python app with snake_case names:

```
official_text    psychometric_tension    user_id    chunk_text
```

EF Core's default is to use the C# property name. `OfficialText` would become a column named
`OfficialText`, which does not exist, and the query fails.

So every column is spelled out:

```csharp
entity.Property(e => e.OfficialText).HasColumnName("official_text").IsRequired();
```

> **This fails at runtime, not compile time.** A wrong or missing mapping produces a
> PostgreSQL "column does not exist" error when that query first runs — possibly in
> production. If you add a property to an entity, add its mapping here in the same change.

### Three mappings that are easy to get wrong

**pgvector.** The extension is declared, and the embedding column typed explicitly:

```csharp
modelBuilder.HasPostgresExtension("vector");
entity.Property(e => e.Embedding).HasColumnType("vector(384)");
```

The dimension must match both `EMBEDDING_DIMENSION` and the vectors already written by the
Python ingestion script. Change it and every stored vector becomes unreadable.

**`json`, not `jsonb`.** `ChatMessage.RetrievedChunkIds` is mapped as `json`:

```csharp
entity.Property(e => e.RetrievedChunkIds).HasColumnType("json");
```

Npgsql defaults to `jsonb`. SQLAlchemy created this column as plain `json`. They are
different PostgreSQL types, and the mismatch breaks reads.

**Composite keys.** `user_progress` and `user_badges` are keyed on pairs:

```csharp
entity.HasKey(e => new { e.UserId, e.PrincipleId });
```

The `user_badges` composite key is what makes badge awards idempotent — a duplicate insert
would violate it.

### Lifetime

Registered as **scoped** in `Program.cs`: one context per HTTP request, disposed when the
request ends. This mirrors FastAPI's `get_db()` dependency, which yielded a session per
request.

A `DbContext` is **not thread-safe** and tracks changes for its lifetime. Holding one longer
than a request — for instance by injecting it into a singleton — causes stale reads and
cross-request data leaks. This is the single most common EF Core mistake.

---

## `DatabaseSeeder.cs`

Inserts the ten principles, their ten badges, and the demo user.

### Idempotent by design

It runs on **every startup**. Existing rows are updated in place rather than duplicated:

```
for each of the 10 principles:
    row exists?  →  update its fields
    row missing? →  insert it
```

Two consequences worth knowing:

- Restarting the app is always safe.
- **Editing the text in this file and restarting is how you publish a wording change.**
  The database is not the source of truth for principle text; this file is.

### What it does not seed

**`leadership_chunks`.** Those 40 embedded passages come from
[`../../../backend/ingest_all.py`](../../../backend/ingest_all.py), because producing them
means running source documents through an embedding model. This app reads them.

If that table is empty, the app still starts and most endpoints work — but `/mentor/ask`
and lesson steps 3 and 4 return ungrounded answers, with no warning. Check it:

```sql
SELECT count(*) FROM leadership_chunks;   -- expect 40
```

### The demo user

There is no sign-up flow anywhere in this application, so a user must exist for anything to
work. One is seeded: **id 1, "Leader Candidate"**.

### Badge ids mirror principle ids

Badge N belongs to principle N. `LessonService` relies on this — it looks up the badge for a
principle by fetching the badge with that same id. Break the alignment and the badge lookup
silently finds nothing, so the lesson completes without granting anything.

---

## Schema creation at startup

In `Program.cs`, after the container is built:

```csharp
await dbContext.Database.ExecuteSqlRawAsync("CREATE EXTENSION IF NOT EXISTS vector");
await dbContext.Database.EnsureCreatedAsync();
await DatabaseSeeder.SeedAsync(dbContext);
```

**Order matters.** pgvector must exist before a table with a `vector` column can be created.

`EnsureCreatedAsync` rather than `MigrateAsync`, deliberately: it creates missing tables on a
fresh database and **does nothing to an existing one**. The Python backend owns this schema,
and the two stacks share it — so the .NET side fills gaps and never alters what is already
there.

If you later make .NET the sole owner of the schema, switch to EF Core migrations
(`dotnet ef migrations add ...`) and `MigrateAsync`. Until then, `EnsureCreated` is the safe
choice precisely because it cannot rewrite a table Python created.
