namespace VeonVerse.Api.Entities;

/// <summary>
/// Join row recording that a user earned a badge, and when.
/// Python equivalent: <c>class UserBadge</c> in <c>backend/app/models.py</c>.
/// Table: <c>user_badges</c>. Composite primary key of (UserId, BadgeId).
/// </summary>
/// <remarks>
/// The composite key is what makes badges idempotent: awarding the same badge twice would
/// violate the primary key, so <c>LessonService</c> checks for an existing row first.
/// </remarks>
public class UserBadge
{
    public int UserId { get; set; }

    public int BadgeId { get; set; }

    public DateTime EarnedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
    public Badge? Badge { get; set; }
}
