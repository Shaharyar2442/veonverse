using Microsoft.EntityFrameworkCore;
using VeonVerse.Api.Entities;

namespace VeonVerse.Api.Data;

/// <summary>
/// Inserts or refreshes the ten leadership principles, their badges, and the demo user.
/// Python equivalent: <c>seed_initial_data()</c> in <c>backend/app/seed.py</c>.
/// </summary>
/// <remarks>
/// <para><b>Idempotent by design.</b> It runs on every startup. Existing rows are updated in
/// place rather than duplicated, so restarting the app is always safe and editing the text
/// below then restarting is how you publish a wording change.</para>
///
/// <para><b>What it does not seed:</b> the <c>leadership_chunks</c> table. Those 40 embedded
/// passages come from the Python ingestion script (<c>backend/ingest_all.py</c>), because
/// producing them means embedding the source documents. This app reads them.</para>
/// </remarks>
public static class DatabaseSeeder
{
    /// <summary>
    /// The canonical principle definitions. Ids are explicit and stable: badge ids mirror
    /// them, and <c>leadership_chunks.principle_id</c> points at them.
    /// </summary>
    private static readonly IReadOnlyList<PrincipleSeed> PrincipleSeeds =
    [
        new(1, "Clarity is Our Superpower",
            "Clarity is Our Superpower means driving total transparency, cutting through noise, and communicating with extreme precision. Leaders isolate what truly matters and eliminate unnecessary complexity.",
            "Synthesizing complex data into unambiguous priorities and rapid decisions.",
            "Simplification vs. Comprehensiveness",
            "Communication, Decision-making",
            "Interpersonal / Leadership",
            "Clarity Champion",
            "Complete the 'Clarity is Our Superpower' leadership principle lesson."),

        new(2, "Our Pioneering Spirit Defines Us",
            "Our Pioneering Spirit Defines Us means embracing innovation, questioning legacy paradigms, and taking bold risks to invent new solutions from first principles.",
            "Creating solutions from scratch based on user needs over safe best-practice replication.",
            "Innovation vs. Sticking to Proven Best-Practices",
            "Driving Innovation, Taking Smart Risks",
            "Business / Business & Interpersonal",
            "Pioneer Trailblazer",
            "Complete the 'Our Pioneering Spirit Defines Us' leadership principle lesson."),

        new(3, "We Fight Against Mediocrity",
            "We Fight Against Mediocrity means rejecting 'good enough' outcomes and actively raising standards through ownership, rigor, and continuous improvement.",
            "Disrupting steady-state execution to elevate performance from good to world-class.",
            "Constructive Dissatisfaction (Restlessness) vs. Contented Steady-State Execution (Stability)",
            "Driving for Results, Self-development",
            "Intrapersonal / Interpersonal & Interpersonal",
            "Excellence Driver",
            "Complete the 'We Fight Against Mediocrity' leadership principle lesson."),

        new(4, "We Put Results Above Rituals",
            "We Put Results Above Rituals means prioritizing tangible business outcomes and customer value over bureaucratic protocol, unnecessary committee approvals, and rigid governance rituals.",
            "Choosing outcome-driven agility and accountability over rigid corporate protocols.",
            "Outcome-Driven Agility vs. Protocol Compliance",
            "Driving Performance, Accountability",
            "Leadership / Leadership & Interpersonal",
            "Agility Master",
            "Complete the 'We Put Results Above Rituals' leadership principle lesson."),

        new(5, "We Hire for Potential and Drive",
            "We Hire for Potential and Drive means choosing high-learning-agility, ambitious talent capable of exponential growth over predictable candidates with static linear experience.",
            "Betting on unproven, high-potential drivers with massive learning agility.",
            "High Potential Drivers vs. Safe Bets with Tested Experience",
            "Developing People, Self-development",
            "Leadership / Leadership & Interpersonal",
            "Talent Catalyst",
            "Complete the 'We Hire for Potential and Drive' leadership principle lesson."),

        new(6, "Courage Fuels Our Leadership",
            "Courage Fuels Our Leadership means practicing radical candor, intellectual honesty, and standing up for what is right even when socially or politically uncomfortable.",
            "Challenging flawed assumptions respectfully to protect objective business success.",
            "Radical Candor & Intellectual Honesty vs. Social Preservation & Diplomatic Harmony",
            "Taking Smart Risks, Integrity",
            "Intrapersonal / Interpersonal & Interpersonal",
            "Courageous Leader",
            "Complete the 'Courage Fuels Our Leadership' leadership principle lesson."),

        new(7, "We Aim for Audacious Impact",
            "We Aim for Audacious Impact means setting game-changing, exponential goals that reshape markets rather than settling for incremental, safe progress.",
            "Championing exponential strategic moonshots over safe incremental security.",
            "Exponential Moonshots (Disruption) vs. Incremental Security (Safe Margins)",
            "Driving Strategy, Overcoming Obstacles",
            "Leadership / Leadership & Interpersonal",
            "Moonshot Architect",
            "Complete the 'We Aim for Audacious Impact' leadership principle lesson."),

        new(8, "We Incentivize with Integrity",
            "We Incentivize with Integrity means uncompromising adherence to ethical boundaries and values. No commercial target or financial incentive is worth compromising integrity.",
            "Protecting value-driven ethical boundaries under high-stakes commercial pressure.",
            "Value Driven Boundary vs. Results at All Costs",
            "Integrity, Accountability",
            "Intrapersonal / Interpersonal & Interpersonal",
            "Integrity Guardian",
            "Complete the 'We Incentivize with Integrity' leadership principle lesson."),

        new(9, "We Stand Strong Together",
            "We Stand Strong Together means fostering an interdependent ecosystem over lone-wolf behaviors. True leaders build cross-functional synergy and win together as one unified organization.",
            "Lifting team capacity and cross-functional alignment over siloed top performance.",
            "Interdependent Ecosystem vs. Lone-Wolf",
            "Teamwork, Relationship Building",
            "Interpersonal / Interpersonal & Interpersonal",
            "Unity Builder",
            "Complete the 'We Stand Strong Together' leadership principle lesson."),

        new(10, "We Never Give Up",
            "We Never Give Up means demonstrating unyielding grit, emotional composure, and resilience when encountering major strategic roadblocks to adapt and succeed.",
            "Persisting through major roadblocks with grit, composure, and tactical adaptation.",
            "Grit vs. Sunk-Cost Containment",
            "Overcoming Obstacles, Handling Stress",
            "Intrapersonal / Interpersonal & Interpersonal",
            "Resilience Titan",
            "Complete the 'We Never Give Up' leadership principle lesson."),
    ];

    /// <summary>
    /// Applies the seed data. Safe to call repeatedly.
    /// </summary>
    public static async Task SeedAsync(VeonVerseDbContext dbContext, CancellationToken cancellationToken = default)
    {
        foreach (var seed in PrincipleSeeds)
        {
            var principle = await dbContext.Principles
                .FirstOrDefaultAsync(p => p.Id == seed.Id, cancellationToken);

            if (principle is null)
            {
                dbContext.Principles.Add(new Principle
                {
                    Id = seed.Id,
                    Number = seed.Id,
                    Title = seed.Title,
                    OfficialText = seed.OfficialText,
                    Summary = seed.Summary,
                    PsychometricTension = seed.PsychometricTension,
                    HoganCompetencies = seed.HoganCompetencies,
                    BehavioralDomains = seed.BehavioralDomains,
                });
            }
            else
            {
                // Refresh in place, so edits to the text above take effect on next start.
                principle.Number = seed.Id;
                principle.Title = seed.Title;
                principle.OfficialText = seed.OfficialText;
                principle.Summary = seed.Summary;
                principle.PsychometricTension = seed.PsychometricTension;
                principle.HoganCompetencies = seed.HoganCompetencies;
                principle.BehavioralDomains = seed.BehavioralDomains;
            }

            var badge = await dbContext.Badges.FirstOrDefaultAsync(b => b.Id == seed.Id, cancellationToken);

            if (badge is null)
            {
                dbContext.Badges.Add(new Badge
                {
                    Id = seed.Id,
                    Name = seed.BadgeName,
                    Criteria = seed.BadgeCriteria,
                });
            }
            else
            {
                badge.Name = seed.BadgeName;
                badge.Criteria = seed.BadgeCriteria;
            }
        }

        // The app has no sign-up flow, so a single demo user must exist for anything to work.
        var defaultUser = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == 1, cancellationToken);

        if (defaultUser is null)
        {
            dbContext.Users.Add(new User
            {
                Id = 1,
                Name = "Leader Candidate",
                Xp = 0,
                Level = 1,
                StreakCount = 1,
            });
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    /// <summary>One principle plus the badge it unlocks, as authored above.</summary>
    private record PrincipleSeed(
        int Id,
        string Title,
        string OfficialText,
        string Summary,
        string PsychometricTension,
        string HoganCompetencies,
        string BehavioralDomains,
        string BadgeName,
        string BadgeCriteria
    );
}
