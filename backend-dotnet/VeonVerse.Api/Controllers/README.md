# Controllers — the HTTP endpoints

A controller is the .NET equivalent of a FastAPI route function. These are the only classes
that know HTTP exists.

Python equivalent: the `@app.get(...)` / `@app.post(...)` routes in `backend/app/main.py` —
a file that was deleted when the FastAPI server was retired. It is still named throughout
this folder's comments as provenance; recover it with
`git show HEAD:backend/app/main.py` if you want to read the original.

---

## The ten endpoints

| Method | Path | Controller | What it does |
|---|---|---|---|
| GET | `/` | `HealthController` | Service banner |
| GET | `/health` | `HealthController` | Liveness probe |
| GET | `/principles` | `PrinciplesController` | All ten, with this user's status |
| GET | `/principles/{id}` | `PrinciplesController` | One principle |
| POST | `/lessons/{id}/next` | `LessonsController` | Advance the lesson one step |
| POST | `/mentor/ask` | `MentorController` | Grounded question answering (RAG) |
| GET | `/users/{id}/progress` | `UsersController` | XP, level, streak, per-principle progress |
| GET | `/users/{id}/badges` | `UsersController` | Earned badges, newest first |
| GET | `/stories` | `StoriesController` | Live OpCo news |

Interactive docs: **<http://localhost:18001/docs>**

---

## The one rule: controllers stay thin

A controller should do four things and stop:

1. Accept and bind the request
2. Call a service
3. Translate a domain error into an HTTP status
4. Return a DTO

Business logic belongs in [`../Services/`](../Services/). `LessonsController` is the clearest
example — the six-step state machine is hundreds of lines, and the controller is about
twenty, because all it does is call `AdvanceLessonAsync` and map `ArgumentException` → 400.

`MentorController` is the deliberate exception: it orchestrates retrieve → augment →
generate inline, because that sequence *is* the endpoint and extracting it would add a layer
without adding clarity.

---

## FastAPI → ASP.NET Core

| FastAPI | ASP.NET Core |
|---|---|
| `@app.get("/principles")` | `[HttpGet]` + `[Route("principles")]` on the class |
| `@app.post("/mentor/ask")` | `[HttpPost("ask")]` |
| `def f(user_id: int = 1)` | `[FromQuery(Name = "user_id")] int userId = 1` |
| `def f(payload: Model)` | `[FromBody] Model request` |
| `principle_id: int` in the path | `[HttpGet("{principleId:int}")]` — `:int` constrains the route |
| `raise HTTPException(404, detail=...)` | `return NotFound(new { detail = ... })` |
| `Depends(get_db)` | Constructor injection |

`[ApiController]` switches on automatic model validation: a malformed body returns 400 with
a problem-details payload before your method is ever called.

---

## File by file

### `HealthController.cs`

`GET /` returns a banner with links. `GET /health` returns `{"status":"ok"}`.

`/health` **deliberately touches nothing** — no database, no model. It answers "is the
process up?", not "is every dependency healthy?". That is what load balancers and container
orchestrators want: a probe that queries the database will restart a perfectly good process
during a brief database blip, turning a small problem into an outage.

### `PrinciplesController.cs`

Both endpoints merge principle data with the caller's progress, so the UI can tick or grey
out each principle without a second request.

Note the list endpoint fetches **all** progress rows in one query and does the lookup in
memory, rather than querying per principle — ten round trips for the same data.

A principle the user has never touched has no progress row at all, hence
`GetValueOrDefault(p.Id, "not_started")`.

### `LessonsController.cs`

`POST /lessons/{principleId}/next`, body `{"user_id": 1, "user_input": "..."}`.

The thinnest controller here by design. `ArgumentException` from the service means the
caller sent something unusable — unknown user, unknown principle, missing required answer —
which maps to **400**, matching Python's `ValueError` handling.

`user_input` is required at the `discussion` step and at the second `reflection` call, and
ignored everywhere else. The client does not decide which step it is on; the server does.

### `MentorController.cs`

`POST /mentor/ask` — the clearest example of RAG in the codebase, in four moves:

```
retrieve  →  4 closest passages for the question
augment   →  paste them into the prompt: "use ONLY this context"
generate  →  Groq, constrained to JSON
cite      →  return the chunk ids as `sources`
```

**There is no fallback here, and that is deliberate.** If the model call fails, the request
fails. A lesson step can degrade to generic encouragement and still be honest; a mentor
answer with no model behind it would be a fabrication presented as guidance. Compare
`LessonService`, which *does* fall back — the difference is the point.

Both conversational turns are written to `chat_messages` with the chunk ids attached, so the
grounding of any past answer stays auditable.

### `UsersController.cs`

`GET /users/{id}/progress` and `GET /users/{id}/badges`.

`Level` falls back to recomputing from XP if the stored value is somehow 0, so a bad row
cannot show a learner "Level 0".

**The badges query carries a lesson.** It orders on the joined row *before* projecting into
`BadgeItem`:

```csharp
.Join(..., (userBadge, badge) => new { userBadge.EarnedAt, Badge = badge })
.OrderByDescending(row => row.EarnedAt)      // order first
.Select(row => new BadgeItem(...))           // project second
```

Ordering *after* projecting — reading `.EarnedAt` off the `BadgeItem` being constructed —
throws at runtime: EF Core has no SQL column to sort on at that point. This endpoint
returned 500 during the port until it was rewritten this way. It is a genuinely easy mistake
and it compiles cleanly.

### `StoriesController.cs`

`GET /stories?limit=8&refresh=false`. Served from a 30-minute cache; `refresh=true` bypasses
it.

The route is declared as `[HttpGet("stories")]` rather than relying on the controller-name
convention, because the path sits at the root and must match the Python URL exactly.

---

## Error responses

Errors use `{"detail": "..."}` — matching FastAPI's shape, so frontend error handling works
against either backend unchanged.

| Status | When |
|---|---|
| 400 | Malformed body, or a required `user_input` was missing |
| 404 | Unknown user or principle |
| 500 | Unhandled — e.g. Groq unreachable on `/mentor/ask` |

---

## JSON naming

Every response is serialized to **snake_case** (`official_text`, `step_number`) by the global
policy in [`../Program.cs`](../Program.cs). C# properties are PascalCase, so without that
policy the API would emit `officialText` and the React frontend would silently read
`undefined` everywhere — no error, just blank fields.

That one line is what lets the existing frontend point at either backend with no code change.
