# Configuration — settings and the `.env` bridge

Three files whose shared purpose is letting the .NET backend read **the same `.env` the
Python backend reads**, so one configuration file drives both stacks.

Python equivalent: [`../../../backend/app/config.py`](../../../backend/app/config.py).

---

## Why this folder needs to exist

Python's `pydantic-settings` reads `.env` out of the box. **.NET does not** — it expects
`appsettings.json` and environment variables. And even once the file is read, two values
need translating before .NET can use them.

```
repo-root .env                          What .NET needs
──────────────────────────────────────  ─────────────────────────────────────
GROQ_API_KEY=gsk_...                    VeonVerseOptions.GroqApiKey
DATABASE_URL=postgresql+psycopg2://...  Host=...;Port=...;Database=...
```

Rather than force you to maintain settings in two places and keep them in sync, these three
files bridge the gap.

---

## `VeonVerseOptions.cs`

A plain settings class. Every property corresponds to a `.env` key.

| Property | `.env` key | Default | Notes |
|---|---|---|---|
| `GroqApiKey` | `GROQ_API_KEY` | *(empty)* | Empty → lessons fall back to canned text; `/mentor/ask` fails |
| `GroqModelId` | `GROQ_MODEL_ID` | `openai/gpt-oss-120b` | Must support `json_object` response format |
| `DatabaseUrl` | `DATABASE_URL` | `…@localhost:15432/veonverse` | SQLAlchemy URL form accepted |
| `EmbeddingDimension` | `EMBEDDING_DIMENSION` | `384` | Must match the stored vectors |
| `LocalEmbeddingModel` | `LOCAL_EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | Informational only |
| `DefaultPrincipleId` | `DEFAULT_PRINCIPLE_ID` | `1` | Used by `/mentor/ask` when none is named |
| `LessonXpReward` | `LESSON_XP_REWARD` | `100` | XP per completed principle |
| `OnnxModelDirectory` | — | `Models_Onnx` | Where `model.onnx` and `vocab.txt` live |

### `EmbeddingDimensionDefault` is a `const`, not a setting

```csharp
public const int EmbeddingDimensionDefault = 384;
```

`VeonVerseDbContext` needs this value at model-building time to declare `vector(384)`, which
must be a compile-time constant. It is not really tunable anyway: changing it requires a
different model **and** re-embedding all 40 chunks, so treating it as a freely adjustable
knob would be misleading.

### Registered as a concrete singleton

```csharp
builder.Services.AddSingleton(options);
```

So services inject `VeonVerseOptions` directly rather than `IOptions<VeonVerseOptions>`.
Fewer moving parts, and the settings are fixed at startup anyway.

---

## `DotEnvLoader.cs`

Parses a `.env` file into a dictionary that .NET's configuration system can layer in.

### What it supports

```bash
# a comment — skipped
KEY=value
QUOTED="value with spaces"       # surrounding quotes stripped
DATABASE_URL=postgres://a:b@c/d  # everything after the FIRST '=' is the value
                                 # (connection strings and keys often contain '=')
```

Blank lines and `#` comments are skipped.

### What it deliberately does not support

Multi-line values, variable expansion (`${OTHER}`), and `export` prefixes. The project's
`.env` uses none of them, and a small predictable parser is easier to trust than a clever
one that might mis-parse a key.

### `FindEnvFile` walks upward

It searches up to six directory levels for a `.env`. This matters because the working
directory differs depending on how the app was started — `dotnet run` from the project
folder, `dotnet exec` from `bin/`, an IDE, a container. Searching upward makes all of them
behave identically, which is the same problem `config.py` solves by resolving the repo root
as an absolute path.

A missing `.env` is not an error — it simply means "no overrides", and `appsettings.json`
plus environment variables take over.

---

## `DatabaseUrlConverter.cs`

Translates SQLAlchemy's URL form into an Npgsql connection string.

```
postgresql+psycopg2://veonverse:veonverse@localhost:15432/veonverse
                ↓
Host=localhost;Port=15432;Database=veonverse;Username=veonverse;Password=veonverse
```

**`+psycopg2` is SQLAlchemy's driver selector.** It is meaningless outside Python, so it is
stripped before parsing. `postgresql://`, `postgres://` and any `+driver` variant are all
accepted.

Parsing goes through `System.Uri`, which handles percent-encoded passwords, IPv6 hosts and
omitted ports correctly — all things a hand-rolled string split gets wrong eventually.
`uri.Port` is `-1` when the URL omits the port, hence the fall back to 5432.

A value already in Npgsql key/value form is passed through unchanged, so this is safe to
call on whatever configuration happens to contain.

A non-PostgreSQL scheme throws with an explanatory message. This app cannot run on another
database: the vector search depends on pgvector.

---

## How it all comes together in `Program.cs`

```csharp
// 1. Find and load the repo-root .env
var envFilePath = DotEnvLoader.FindEnvFile(builder.Environment.ContentRootPath);
builder.Configuration.AddInMemoryCollection(DotEnvLoader.Load(envFilePath));

// 2. Bind the flat keys onto the options object
options.GroqApiKey = builder.Configuration["GROQ_API_KEY"] ?? options.GroqApiKey;
// ...

// 3. Translate the URL for Npgsql
var connectionString = DatabaseUrlConverter.ToNpgsqlConnectionString(options.DatabaseUrl);
```

**Precedence, lowest to highest:**

```
appsettings.json  →  .env  →  real environment variables
```

A real environment variable always wins, which is what makes container and CI overrides work
without editing files.

The binding in step 2 is written out by hand rather than using `Configuration.Bind()`,
because the `.env` names (`GROQ_API_KEY`) do not match the C# property names (`GroqApiKey`).
Being explicit makes the mapping greppable instead of magic — if a setting is not taking
effect, this is the list to check.

On startup the app prints which file it found:

```
[config] Loaded environment file: /Users/you/Documents/veon-verse/.env
```

If that line is missing or points somewhere unexpected, configuration is the first thing to
suspect.
