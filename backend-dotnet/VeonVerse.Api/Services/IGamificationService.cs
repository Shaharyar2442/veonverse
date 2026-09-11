using VeonVerse.Api.Entities;

namespace VeonVerse.Api.Services;

/// <summary>
/// XP, level and streak rules.
/// </summary>
public interface IGamificationService
{
    /// <summary>Level implied by an XP total. 100 XP per level, minimum level 1.</summary>
    int ComputeLevel(int xp);

    /// <summary>XP still needed to reach the next level.</summary>
    int XpToNextLevel(int xp);

    /// <summary>
    /// Adds XP (when positive), recomputes the level, and marks the user active today.
    /// </summary>
    /// <remarks>
    /// Mutates <paramref name="user"/> in place without saving. The caller persists the
    /// change as part of its own transaction.
    /// </remarks>
    void AwardXpAndTouchActivity(User user, int xpDelta);
}
