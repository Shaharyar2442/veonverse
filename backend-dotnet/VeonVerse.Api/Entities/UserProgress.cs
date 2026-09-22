namespace VeonVerse.Api.Entities;

/// <summary>
/// Where one user has reached inside one principle's lesson.
/// Python equivalent: <c>class UserProgress</c> in <c>backend/app/models.py</c>.
/// Table: <c>user_progress</c>. Composite primary key of (UserId, PrincipleId).
/// </summary>
/// <remarks>
/// This row is the lesson state machine's memory. <see cref="CurrentStep"/> decides which
/// branch <c>LessonService.AdvanceLessonAsync</c> runs on the next call, so the client never
/// tells the server which step it wants — it just asks for "next".
/// </remarks>
public class UserProgress
{
    public int UserId { get; set; }

    public int PrincipleId { get; set; }

    /// <summary>"not_started", "in_progress" or "completed".</summary>
    public string Status { get; set; } = "not_started";

    /// <summary>
    /// One of: intro, discussion, official_principle, examples, reflection, completion.
    /// Always the step that will run *next*, not the one just finished.
    /// </summary>
    public string CurrentStep { get; set; } = "intro";

    /// <summary>Which of the four intro options the learner picked.</summary>
    public string? ChosenScenarioAnswer { get; set; }

    /// <summary>The learner's free-text answer at the reflection step.</summary>
    public string? ReflectionResponse { get; set; }

    public DateTime? CompletedAt { get; set; }

    // Navigation properties. EF Core uses these to build the joins; the Python
    // version had no relationships configured and queried each table separately.
    public User? User { get; set; }
    public Principle? Principle { get; set; }
}
