namespace VeonVerse.Api.Dtos;

/// <summary>
/// Request body for <c>POST /mentor/ask</c> — the free-form "ask anything" endpoint.
/// Python equivalent: <c>class MentorAskRequest</c> in <c>backend/app/schemas.py</c>.
/// </summary>
/// <param name="UserId">Who is asking. Must exist, or the endpoint returns 404.</param>
/// <param name="Question">The natural-language question.</param>
/// <param name="PrincipleId">
/// Optional filter narrowing retrieval to one principle. When null, falls back to
/// <c>DefaultPrincipleId</c> from configuration.
/// </param>
public record MentorAskRequest(int UserId, string Question, int? PrincipleId = null);

/// <summary>
/// A grounded answer plus the chunks that justified it.
/// Python equivalent: <c>class MentorAskResponse</c>.
/// </summary>
/// <param name="Step">Always "mentor_ask" — lets the UI reuse the lesson renderer.</param>
/// <param name="Text">The answer.</param>
/// <param name="Options">Always null here; present only so the shape matches <see cref="LessonStepResponse"/>.</param>
/// <param name="AvatarState">Animation cue for the UI.</param>
/// <param name="Sources">
/// Ids of the leadership chunks retrieved for this answer. These are the receipts: they show
/// which source passages the model was given, so an answer can be checked against them.
/// </param>
public record MentorAskResponse(
    string Step,
    string Text,
    IReadOnlyList<string>? Options,
    string AvatarState,
    IReadOnlyList<string> Sources
);
