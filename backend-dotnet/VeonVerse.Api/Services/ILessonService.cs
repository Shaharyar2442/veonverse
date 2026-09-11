using VeonVerse.Api.Dtos;

namespace VeonVerse.Api.Services;

/// <summary>
/// Drives the six-step guided lesson.
/// </summary>
public interface ILessonService
{
    /// <summary>
    /// Runs whichever step this user's progress row says is due, advances that row, and
    /// returns what the avatar should say.
    /// </summary>
    /// <param name="userInput">
    /// The learner's answer to the previous step. Required at <c>discussion</c> and at the
    /// second <c>reflection</c> call; ignored otherwise.
    /// </param>
    /// <exception cref="ArgumentException">Unknown user or principle, or required input missing — surfaced as HTTP 400.</exception>
    Task<LessonStepResponse> AdvanceLessonAsync(
        int userId,
        int principleId,
        string? userInput = null,
        CancellationToken cancellationToken = default);
}
