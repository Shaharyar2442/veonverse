namespace VeonVerse.Api.Dtos;

/// <summary>
/// Progress on a single principle.
/// Python equivalent: <c>class ProgressItem</c> in <c>backend/app/schemas.py</c>.
/// </summary>
/// <param name="StepNumber">
/// <paramref name="CurrentStep"/> translated to 1-6 via the step map in <c>LessonService</c>,
/// so the UI can render a progress bar without knowing the step names.
/// </param>
public record ProgressItem(
    int PrincipleId,
    string Status,
    string CurrentStep,
    int StepNumber,
    string? ChosenScenarioAnswer,
    string? ReflectionResponse,
    DateTime? CompletedAt
);

/// <summary>
/// A user's full gamification state.
/// Python equivalent: <c>class UserProgressResponse</c>.
/// </summary>
/// <param name="XpToNextLevel">Points still needed to level up — precomputed so the UI does no arithmetic.</param>
public record UserProgressResponse(
    int UserId,
    int Xp,
    int Level,
    int StreakCount,
    int XpToNextLevel,
    IReadOnlyList<ProgressItem> Progress
);

/// <summary>
/// One earned badge.
/// Python equivalent: <c>class BadgeItem</c>.
/// </summary>
public record BadgeItem(
    int BadgeId,
    string Name,
    string Criteria,
    DateTime EarnedAt
);

/// <summary>
/// All badges a user has earned, newest first.
/// Python equivalent: <c>class UserBadgesResponse</c>.
/// </summary>
public record UserBadgesResponse(int UserId, IReadOnlyList<BadgeItem> Badges);
