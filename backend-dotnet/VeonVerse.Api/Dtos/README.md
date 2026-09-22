# Dtos — the shapes that cross the wire

DTO means **Data Transfer Object**: the shape of data going in and out over HTTP, as
distinct from the shape stored in the database.

Python equivalent: the Pydantic models in `backend/app/schemas.py` — deleted along with the
FastAPI server, and recoverable via `git show HEAD:backend/app/schemas.py`.

---

## Why these are separate from Entities

It is tempting to return `Entities.Principle` straight from a controller. Three reasons not
to:

**1. The shapes genuinely differ.** `Principle` has no notion of a per-user status. The API
response does — that is what lets the UI tick completed principles. Different shapes, so
different types.

**2. Internal columns would leak.** Returning entities means every column you ever add is
immediately public API. Someone adds an `internal_notes` column, and it silently starts
appearing in responses.

**3. Independent change.** The database schema and the wire format can evolve separately.
Rename a column without breaking every client.

```
Entities/Principle.cs        Dtos/PrincipleItem
─────────────────────        ──────────────────────
what the TABLE holds    →    what the API RETURNS
                             (+ this user's status)
```

---

## `record` instead of `class`

Every DTO is a C# `record`:

```csharp
public record PrincipleItem(int Id, int Number, string Title, ...);
```

A record is **immutable** (properties are read-only after construction) and gets
compiler-generated equality, `ToString()`, and `with` expressions. This is the closest
analogue to a Pydantic model, and immutability is genuinely useful here: once a response is
built, nothing downstream can quietly mutate it.

The `with` expression matters in `LessonService`:

```csharp
return response with { Step = step, Options = null };
```

That creates a modified copy rather than mutating the original — which is how the server
overrides whatever step name the model suggested, without touching the model's reply.

---

## snake_case on the wire

Properties are PascalCase in C# but serialize to snake_case, via one line in
[`../Program.cs`](../Program.cs):

```csharp
jsonOptions.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
```

```
C#                      JSON
────────────────────    ──────────────────────
OfficialText       →    "official_text"
PsychometricTension →   "psychometric_tension"
StepNumber         →    "step_number"
AvatarState        →    "avatar_state"
```

**This is what makes the React frontend work against either backend unchanged.** Without it
the API would emit `officialText`, the frontend would read `undefined`, and every field
would render blank — with no error anywhere.

Incoming JSON binds case-insensitively, so `{"user_id": 1}` maps to `UserId`.

Nulls are **emitted rather than omitted** (`DefaultIgnoreCondition = Never`), because the
frontend checks for the presence of `options`. Dropping the key would change behaviour.

---

## File by file

### `PrincipleDtos.cs`

- **`PrincipleItem`** — a principle plus `Status` for the requesting user
- **`PrincipleListResponse`** — wraps the list

The list is wrapped in an object rather than returned as a bare array:

```json
{ "principles": [ ... ] }
```

This matches the Python API exactly — the frontend reads `response.principles` — and leaves
room to add paging metadata later without breaking clients.

### `LessonDtos.cs`

- **`LessonNextRequest`** — `{ user_id, user_input? }`
- **`LessonStepResponse`** — one step of the conversation

`LessonNextRequest` carries no step field, and that is the key design point: **the client
does not say where it is.** The server reads `UserProgress.CurrentStep` and decides. This is
why refreshing resumes correctly and why a client cannot skip ahead to farm XP.

`LessonStepResponse.Options` holds four choices at the intro step and `null` everywhere
else. `Xp` is the value *after* this step, so the HUD updates from one payload.
`TotalSteps` is always 6, sent so the UI does not hardcode it.

### `MentorDtos.cs`

- **`MentorAskRequest`** — `{ user_id, question, principle_id? }`
- **`MentorAskResponse`** — the answer plus `sources`

**`Sources` is the important field.** It carries the ids of the passages retrieved to ground
the answer — the receipts. Given an answer, you can go back to exactly the source text the
model was shown and check whether the answer follows from it. This is what separates a RAG
answer from a plausible-sounding guess.

`Options` is always null here; it exists only so the shape matches `LessonStepResponse` and
the UI can reuse its renderer.

### `UserDtos.cs`

- **`ProgressItem`** — progress on one principle
- **`UserProgressResponse`** — XP, level, streak, and the list
- **`BadgeItem`** / **`UserBadgesResponse`** — earned badges

`StepNumber` is `CurrentStep` translated to 1-6 via the map in `LessonService`, so the UI can
draw a progress bar without knowing step names. `XpToNextLevel` is precomputed server-side
so the UI does no arithmetic.

### `SharedDtos.cs`

Two internal shapes that are not wire contracts:

- **`RetrievedChunk`** — a passage with its similarity score, returned by `RetrievalService`.
  Only `Id` ever reaches a client, as part of `sources`.
- **`MentorStructuredResponse`** — the four-key contract every LLM call must satisfy:
  `step`, `text`, `options`, `avatar_state`. `GroqService` rejects any reply missing one,
  which is what stops malformed model output reaching the UI.

---

## Validation

`[ApiController]` on each controller switches on automatic validation. A request body that
cannot bind to its DTO returns **400** with a problem-details payload before the controller
method runs — the same outcome as FastAPI rejecting a bad body against a Pydantic model.

Required vs optional is expressed by nullability: `string?` is optional, `string` is
required. `LessonNextRequest.UserInput` is `string?` because most steps do not need it; the
steps that *do* check for it explicitly and raise a 400 with a specific message.
