namespace VeonVerse.Api.Entities;

/// <summary>
/// An award unlocked by completing a principle.
/// Python equivalent: <c>class Badge</c> in <c>backend/app/models.py</c>.
/// Table: <c>badges</c>.
/// </summary>
/// <remarks>
/// Badge ids deliberately mirror principle ids 1:1 — the lesson service looks up the badge
/// for principle N by fetching badge N directly (see <c>LessonService</c>). The seeder
/// depends on this, so keep the two id ranges aligned.
/// </remarks>
public class Badge
{
    public int Id { get; set; }

    /// <summary>Display name, e.g. "Clarity Champion".</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Human-readable unlock condition, shown in the badge drawer.</summary>
    public string Criteria { get; set; } = string.Empty;
}
