using VeonVerse.Api.Entities;

namespace VeonVerse.Api.Services;

/// <summary>
/// XP, levels and daily streaks.
/// Python equivalent: <c>backend/app/services/gamification.py</c>.
/// </summary>
/// <remarks>
/// Pure rules with no database access of their own — the caller owns the transaction and
/// decides when to save. That keeps the arithmetic trivially testable and means awarding XP
/// can be folded into the same commit as the progress update it accompanies.
/// </remarks>
public class GamificationService : IGamificationService
{
    /// <summary>XP needed per level.</summary>
    private const int XpPerLevel = 100;

    /// <inheritdoc />
    /// <remarks>
    /// 0-99 XP is level 1, 100-199 is level 2, and so on. The <c>Math.Max</c> guard keeps a
    /// user at level 1 even if XP were somehow negative.
    /// </remarks>
    public int ComputeLevel(int xp) => Math.Max(1, 1 + (xp / XpPerLevel));

    /// <inheritdoc />
    /// <remarks>
    /// Example: at 250 XP the level is 3, the next threshold is 300, so 50 XP remain.
    /// </remarks>
    public int XpToNextLevel(int xp)
    {
        var currentLevel = ComputeLevel(xp);
        return Math.Max(0, (currentLevel * XpPerLevel) - xp);
    }

    /// <inheritdoc />
    public void AwardXpAndTouchActivity(User user, int xpDelta)
    {
        // A zero or negative delta still counts as activity. That is deliberate: simply
        // continuing a lesson should keep a streak alive, even on a step that pays nothing.
        if (xpDelta <= 0)
        {
            TouchActivity(user);
            return;
        }

        user.Xp += xpDelta;
        user.Level = ComputeLevel(user.Xp);
        TouchActivity(user);
    }

    /// <summary>
    /// Updates the daily streak.
    /// </summary>
    /// <remarks>
    /// <para>Three cases:</para>
    /// <list type="bullet">
    ///   <item><description><b>Already active today</b> — return immediately, so a streak counts days, not sessions.</description></item>
    ///   <item><description><b>Last active yesterday</b> — the chain continues, so increment.</description></item>
    ///   <item><description><b>Any older date, or never</b> — the chain broke, so reset to 1.</description></item>
    /// </list>
    /// <para>Dates are compared as "yyyy-MM-dd" strings in the server's local time zone,
    /// matching Python's <c>date.today().isoformat()</c> exactly — both stacks therefore
    /// agree on when a day rolls over.</para>
    /// </remarks>
    private static void TouchActivity(User user)
    {
        var today = DateTime.Now.ToString("yyyy-MM-dd");

        if (string.IsNullOrEmpty(user.LastActiveDay))
        {
            user.StreakCount = 1;
        }
        else
        {
            if (user.LastActiveDay == today)
            {
                return;
            }

            var yesterday = DateTime.Now.AddDays(-1).ToString("yyyy-MM-dd");

            user.StreakCount = user.LastActiveDay == yesterday
                ? user.StreakCount + 1
                : 1;
        }

        user.LastActiveDay = today;
    }
}
