namespace VeonVerse.Api.Dtos;

/// <summary>
/// A retrieved passage with its similarity score — the output of the vector search.
/// Python equivalent: the plain dictionaries returned by <c>retrieve_context()</c> in
/// <c>backend/app/services/retrieval.py</c>.
/// </summary>
/// <param name="Id">The chunk's database id, surfaced to clients as a citation.</param>
/// <param name="Score">
/// Similarity in the range 0-1, higher is more similar. Computed as
/// <c>1 - cosine_distance</c>, clamped at 0.
/// </param>
/// <remarks>
/// This is an internal shape rather than a wire contract — only <see cref="Id"/> reaches the
/// client, as part of <see cref="MentorAskResponse.Sources"/>. It is a record so search
/// results can be passed around without anything mutating them mid-flight.
/// </remarks>
public record RetrievedChunk(
    string Id,
    double Score,
    string ChunkText,
    int PrincipleId,
    string? ChunkType,
    string SourceUrl
);

/// <summary>
/// The JSON contract every mentor LLM call must satisfy.
/// Python equivalent: the <c>STEP_SCHEMA</c> / <c>MENTOR_SCHEMA</c> dictionaries in
/// <c>backend/app/services/lesson.py</c> and <c>backend/app/main.py</c>.
/// </summary>
/// <remarks>
/// The model is asked to return exactly these four keys. <c>GroqService</c> rejects any
/// response missing one, which is what stops malformed model output from reaching the UI.
/// </remarks>
public record MentorStructuredResponse(
    string Step,
    string Text,
    IReadOnlyList<string>? Options,
    string AvatarState
);
