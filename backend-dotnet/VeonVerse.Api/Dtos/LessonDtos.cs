namespace VeonVerse.Api.Dtos;

/// <summary>
/// Request body for <c>POST /lessons/{principleId}/next</c>.
/// Python equivalent: <c>class LessonNextRequest</c> in <c>backend/app/schemas.py</c>.
/// </summary>
/// <param name="UserId">Who is taking the lesson.</param>
/// <param name="UserInput">
/// The learner's reply to the previous step. Required at the <c>discussion</c> step (the
/// chosen option) and at the second <c>reflection</c> call (the written reflection);
/// ignored everywhere else. The server decides which step is current, so the client never
/// says where it is — it just sends the answer and asks for what comes next.
/// </param>
public record LessonNextRequest(int UserId, string? UserInput = null);

/// <summary>
/// One step of the mentor conversation.
/// Python equivalent: <c>class LessonStepResponse</c>.
/// </summary>
/// <param name="Step">Which step produced this: intro, discussion, official_principle, examples, reflection, completion.</param>
/// <param name="Text">What the avatar says.</param>
/// <param name="Options">Four choices at the intro step; null at every other step.</param>
/// <param name="AvatarState">Animation cue for the UI, e.g. "Presenting Story", "Celebrating Achievement".</param>
/// <param name="StepNumber">1-6, for the progress indicator.</param>
/// <param name="TotalSteps">Always 6. Sent so the UI does not hardcode it.</param>
/// <param name="Xp">The user's XP *after* this step, so the HUD can update from one payload.</param>
public record LessonStepResponse(
    string Step,
    string Text,
    IReadOnlyList<string>? Options,
    string AvatarState,
    int StepNumber,
    int TotalSteps,
    int Xp
);
