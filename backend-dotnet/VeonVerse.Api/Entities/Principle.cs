namespace VeonVerse.Api.Entities;

/// <summary>
/// One of the ten VEON leadership principles.
/// Python equivalent: <c>class Principle</c> in <c>backend/app/models.py</c>.
/// Table: <c>principles</c>.
/// </summary>
public class Principle
{
    /// <summary>Primary key. Seeded explicitly as 1-10 so badge ids can match principle ids.</summary>
    public int Id { get; set; }

    /// <summary>Display order (1-10). Kept separate from <see cref="Id"/> so principles could be re-ordered.</summary>
    public int Number { get; set; }

    public string Title { get; set; } = string.Empty;

    /// <summary>The formal wording of the principle, shown verbatim to the learner.</summary>
    public string OfficialText { get; set; } = string.Empty;

    /// <summary>A one-line plain-language gloss of the principle.</summary>
    public string Summary { get; set; } = string.Empty;

    /// <summary>The competing pull the principle resolves, e.g. "Simplification vs. Comprehensiveness".</summary>
    public string? PsychometricTension { get; set; }

    /// <summary>Hogan assessment competencies this principle maps onto.</summary>
    public string? HoganCompetencies { get; set; }

    /// <summary>Behavioural domains, e.g. "Interpersonal / Leadership".</summary>
    public string? BehavioralDomains { get; set; }
}
