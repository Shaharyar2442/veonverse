namespace VeonVerse.Api.Entities;

/// <summary>
/// A learner working through the principles.
/// Python equivalent: <c>class User</c> in <c>backend/app/models.py</c>.
/// Table: <c>users</c>.
/// </summary>
/// <remarks>
/// The app ships with a single seeded user (id 1, "Leader Candidate"). There is no
/// authentication in this codebase — the user id arrives as a plain request parameter.
/// </remarks>
public class User
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    /// <summary>Total experience points earned. Awarded on lesson completion.</summary>
    public int Xp { get; set; }

    /// <summary>Derived from <see cref="Xp"/>; stored so it can be read without recomputing.</summary>
    public int Level { get; set; } = 1;

    /// <summary>Consecutive days of activity. Resets to 1 after a missed day.</summary>
    public int StreakCount { get; set; } = 1;

    /// <summary>
    /// Last active date as an ISO string ("yyyy-MM-dd"), matching the Python column
    /// (<c>String(10)</c>) so both stacks read and write the same values.
    /// </summary>
    public string? LastActiveDay { get; set; }
}
