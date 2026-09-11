using Microsoft.EntityFrameworkCore;
using VeonVerse.Api.Configuration;
using VeonVerse.Api.Data;
using VeonVerse.Api.Dtos;
using VeonVerse.Api.Entities;

namespace VeonVerse.Api.Services;

/// <summary>
/// The six-step guided lesson for one principle.
/// Python equivalent: <c>advance_lesson()</c> in <c>backend/app/services/lesson.py</c>.
/// </summary>
/// <remarks>
/// <para><b>The shape of the thing.</b> This is a state machine whose state lives in the
/// database, on <see cref="UserProgress.CurrentStep"/>. The client never says which step it
/// wants — it POSTs "next" plus any answer, and the server runs whichever step the row says
/// is due, then advances the row. Refreshing the page therefore resumes exactly where the
/// learner left off, and a client cannot skip ahead.</para>
///
/// <para><b>The six steps:</b></para>
/// <list type="number">
///   <item><description><b>intro</b> — tell a story about the principle's central tension, offer exactly four actions.</description></item>
///   <item><description><b>discussion</b> — react to the chosen action. <i>Requires input.</i></description></item>
///   <item><description><b>official_principle</b> — explain the formal principle, grounded in retrieved passages.</description></item>
///   <item><description><b>examples</b> — two or three concrete workplace examples, also grounded.</description></item>
///   <item><description><b>reflection</b> — the only step called twice: first to ask the question, then to accept the answer, award XP and grant the badge.</description></item>
///   <item><description><b>completion</b> — a closing encouragement, repeatable forever.</description></item>
/// </list>
///
/// <para><b>Which steps use retrieval.</b> Only <c>official_principle</c> and <c>examples</c>.
/// Those two must be faithful to source material, so passages are fetched and pasted into the
/// prompt. The others are conversational, and grounding them would add cost without value.</para>
/// </remarks>
public class LessonService : ILessonService
{
    /// <summary>
    /// Maps step names to their 1-6 position, for the UI's progress indicator.
    /// Python equivalent: the <c>STEP_TO_NUMBER</c> dictionary.
    /// </summary>
    public static readonly IReadOnlyDictionary<string, int> StepToNumber = new Dictionary<string, int>
    {
        ["intro"] = 1,
        ["discussion"] = 2,
        ["official_principle"] = 3,
        ["examples"] = 4,
        ["reflection"] = 5,
        ["completion"] = 6,
    };

    private const int TotalSteps = 6;

    /// <summary>The persona every prompt is prefixed with, so the voice stays consistent.</summary>
    private const string SystemPrompt =
        "You are the VEON AI Leadership Mentor Avatar, an executive leader speaking warmly, " +
        "inspirationally, and interactively to an employee. Your mission is to teach and convey " +
        "VEON's leadership principles clearly through storytelling, practical guidance, and dialog.";

    private readonly VeonVerseDbContext _dbContext;
    private readonly IGroqService _groqService;
    private readonly IRetrievalService _retrievalService;
    private readonly IGamificationService _gamificationService;
    private readonly VeonVerseOptions _options;
    private readonly ILogger<LessonService> _logger;

    public LessonService(
        VeonVerseDbContext dbContext,
        IGroqService groqService,
        IRetrievalService retrievalService,
        IGamificationService gamificationService,
        VeonVerseOptions options,
        ILogger<LessonService> logger)
    {
        _dbContext = dbContext;
        _groqService = groqService;
        _retrievalService = retrievalService;
        _gamificationService = gamificationService;
        _options = options;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<LessonStepResponse> AdvanceLessonAsync(
        int userId,
        int principleId,
        string? userInput = null,
        CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw new ArgumentException($"User {userId} not found.");

        var principle = await _dbContext.Principles.FirstOrDefaultAsync(p => p.Id == principleId, cancellationToken)
            ?? throw new ArgumentException($"Principle {principleId} not found.");

        var progress = await GetOrCreateProgressAsync(userId, principleId, cancellationToken);

        // Touching activity with zero XP keeps the streak alive on every step.
        _gamificationService.AwardXpAndTouchActivity(user, 0);

        return progress.CurrentStep switch
        {
            "intro" => await RunIntroStepAsync(user, principle, progress, cancellationToken),
            "discussion" => await RunDiscussionStepAsync(user, principle, progress, userInput, cancellationToken),
            "official_principle" => await RunOfficialPrincipleStepAsync(user, principle, progress, cancellationToken),
            "examples" => await RunExamplesStepAsync(user, principle, progress, cancellationToken),
            "reflection" => await RunReflectionStepAsync(user, principle, progress, userInput, cancellationToken),
            "completion" => await RunCompletionStepAsync(user, principle, cancellationToken),
            _ => throw new InvalidOperationException($"Unsupported lesson step: {progress.CurrentStep}"),
        };
    }

    // ---------------------------------------------------------------- step 1: intro --

    /// <summary>
    /// Opens with a story about the principle's tension and offers four possible actions.
    /// </summary>
    private async Task<LessonStepResponse> RunIntroStepAsync(
        User user, Principle principle, UserProgress progress, CancellationToken cancellationToken)
    {
        var prompt =
            $"As the VEON Leadership Avatar, warmly introduce the leadership principle '{principle.Title}' to the employee.\n" +
            $"Share a realistic corporate story highlighting the core tension: {principle.PsychometricTension ?? "Standard vs High Performance"}.\n" +
            "Ask the employee how they would handle this situation and provide exactly 4 practical action choices.";

        var mentorResponse = await RunStructuredCallAsync("intro", prompt, optionsExpected: true, cancellationToken);

        // The UI renders exactly four choice buttons, so anything else is unusable.
        // This mirrors the Python behaviour, which raises here rather than degrading.
        if (mentorResponse.Options is null || mentorResponse.Options.Count != 4)
        {
            throw new InvalidOperationException("Intro response must include exactly 4 options.");
        }

        progress.CurrentStep = "discussion";
        progress.Status = "in_progress";

        LogChat(user.Id, "assistant", mentorResponse.Text);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return BuildResponse(mentorResponse, "intro", "Presenting Story", user.Xp);
    }

    // ----------------------------------------------------------- step 2: discussion --

    /// <summary>
    /// Reacts to the learner's chosen action and ties it back to the principle.
    /// </summary>
    private async Task<LessonStepResponse> RunDiscussionStepAsync(
        User user, Principle principle, UserProgress progress, string? userInput, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(userInput))
        {
            throw new ArgumentException("A selected option is required for the discussion step.");
        }

        progress.ChosenScenarioAnswer = userInput;

        var prompt =
            $"The employee chose this action: '{userInput}'.\n" +
            "As their Leadership Avatar, discuss their choice warmly: commend what is effective, " +
            $"explain how it connects to '{principle.Title}' and Hogan competencies ({principle.HoganCompetencies}), " +
            "and offer one practical leadership insight.";

        var mentorResponse = await RunStructuredCallAsync("discussion", prompt, optionsExpected: false, cancellationToken);

        progress.CurrentStep = "official_principle";

        LogChat(user.Id, "user", userInput);
        LogChat(user.Id, "assistant", mentorResponse.Text);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return BuildResponse(mentorResponse, "discussion", "Coaching & Feedback", user.Xp);
    }

    // --------------------------------------------------- step 3: official principle --

    /// <summary>
    /// Explains the formal principle, grounded in retrieved source passages.
    /// </summary>
    private async Task<LessonStepResponse> RunOfficialPrincipleStepAsync(
        User user, Principle principle, UserProgress progress, CancellationToken cancellationToken)
    {
        var chunks = await _retrievalService.RetrieveContextAsync(
            query: $"Explain {principle.Title} faithfully to official guidance.",
            principleId: principle.Id,
            k: 4,
            cancellationToken: cancellationToken);

        var context = string.Join("\n\n", chunks.Select(chunk => chunk.ChunkText));

        var prompt =
            $"As the Leadership Avatar, explain the official meaning of '{principle.Title}' to the employee " +
            "in an inspiring, easy-to-digest conversational way.\n\n" +
            $"Official Guidance Context:\n{context}";

        var mentorResponse = await RunStructuredCallAsync("official_principle", prompt, optionsExpected: false, cancellationToken);

        progress.CurrentStep = "examples";

        LogChat(user.Id, "assistant", mentorResponse.Text, chunks.Select(c => c.Id).ToList());
        await _dbContext.SaveChangesAsync(cancellationToken);

        return BuildResponse(mentorResponse, "official_principle", "Explaining Principle", user.Xp);
    }

    // ------------------------------------------------------------- step 4: examples --

    /// <summary>
    /// Gives two or three concrete workplace examples, also grounded in retrieved passages.
    /// </summary>
    private async Task<LessonStepResponse> RunExamplesStepAsync(
        User user, Principle principle, UserProgress progress, CancellationToken cancellationToken)
    {
        var chunks = await _retrievalService.RetrieveContextAsync(
            query: $"Give workplace examples of {principle.Title}.",
            principleId: principle.Id,
            k: 4,
            cancellationToken: cancellationToken);

        var context = string.Join("\n\n", chunks.Select(chunk => chunk.ChunkText));

        var prompt =
            $"As the Leadership Avatar, share 2-3 vivid practical workplace examples of putting " +
            $"'{principle.Title}' into action.\n\n" +
            $"Context:\n{context}";

        var mentorResponse = await RunStructuredCallAsync("examples", prompt, optionsExpected: false, cancellationToken);

        progress.CurrentStep = "reflection";

        LogChat(user.Id, "assistant", mentorResponse.Text, chunks.Select(c => c.Id).ToList());
        await _dbContext.SaveChangesAsync(cancellationToken);

        return BuildResponse(mentorResponse, "examples", "Sharing Real Examples", user.Xp);
    }

    // ----------------------------------------------------------- step 5: reflection --

    /// <summary>
    /// The only step that runs twice — it asks, then it receives.
    /// </summary>
    /// <remarks>
    /// <para>First call (<paramref name="userInput"/> null): pose the reflection question and
    /// deliberately leave <c>CurrentStep</c> on "reflection", so the next call lands here again.</para>
    /// <para>Second call (input supplied): store the answer, award XP, grant the badge, and
    /// move to "completion". This is the only place in the lesson where XP is paid.</para>
    /// </remarks>
    private async Task<LessonStepResponse> RunReflectionStepAsync(
        User user, Principle principle, UserProgress progress, string? userInput, CancellationToken cancellationToken)
    {
        // --- first visit: ask the question ---
        if (string.IsNullOrWhiteSpace(userInput))
        {
            var questionPrompt =
                "As the Leadership Avatar, ask the employee an encouraging reflection question: " +
                $"How will they demonstrate '{principle.Title}' in their own role and projects this week?";

            var questionResponse = await RunStructuredCallAsync("reflection", questionPrompt, optionsExpected: false, cancellationToken);

            LogChat(user.Id, "assistant", questionResponse.Text);
            await _dbContext.SaveChangesAsync(cancellationToken);

            return BuildResponse(questionResponse, "reflection", "Listening to Employee", user.Xp);
        }

        // --- second visit: accept the answer and complete the lesson ---
        progress.ReflectionResponse = userInput;
        LogChat(user.Id, "user", userInput);

        _gamificationService.AwardXpAndTouchActivity(user, _options.LessonXpReward);

        progress.CurrentStep = "completion";
        progress.Status = "completed";
        progress.CompletedAt = DateTime.UtcNow;

        // Badge ids mirror principle ids, so the badge for this principle is simply badge N.
        var badge = await _dbContext.Badges
            .FirstOrDefaultAsync(b => b.Id == principle.Id, cancellationToken);

        if (badge is not null)
        {
            var alreadyEarned = await _dbContext.UserBadges
                .AnyAsync(ub => ub.UserId == user.Id && ub.BadgeId == badge.Id, cancellationToken);

            // Replaying a completed lesson must not duplicate the award.
            if (!alreadyEarned)
            {
                _dbContext.UserBadges.Add(new UserBadge
                {
                    UserId = user.Id,
                    BadgeId = badge.Id,
                    EarnedAt = DateTime.UtcNow,
                });
            }
        }

        var congratulationPrompt =
            $"As the Leadership Avatar, warmly congratulate the employee for mastering '{principle.Title}'! " +
            $"Mention they earned {_options.LessonXpReward} XP and unlocked the " +
            $"'{badge?.Name ?? "Principle"}' badge.";

        var mentorResponse = await RunStructuredCallAsync("completion", congratulationPrompt, optionsExpected: false, cancellationToken);

        LogChat(user.Id, "assistant", mentorResponse.Text);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // Reports the post-award XP, so the HUD updates from this single response.
        return BuildResponse(mentorResponse, "completion", "Celebrating Achievement", user.Xp);
    }

    // ----------------------------------------------------------- step 6: completion --

    /// <summary>
    /// Terminal state. Stays here permanently, returning fresh encouragement each time.
    /// </summary>
    private async Task<LessonStepResponse> RunCompletionStepAsync(
        User user, Principle principle, CancellationToken cancellationToken)
    {
        var prompt =
            "As the Leadership Avatar, warmly encourage the employee as they continue their " +
            $"leadership journey with '{principle.Title}'.";

        var mentorResponse = await RunStructuredCallAsync("completion", prompt, optionsExpected: false, cancellationToken);

        LogChat(user.Id, "assistant", mentorResponse.Text);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return BuildResponse(mentorResponse, "completion", "Standing By", user.Xp);
    }

    // ------------------------------------------------------------------- helpers ----

    /// <summary>
    /// Finds this user's progress row for the principle, creating it on first contact.
    /// Python equivalent: <c>_get_or_create_progress()</c>.
    /// </summary>
    private async Task<UserProgress> GetOrCreateProgressAsync(
        int userId, int principleId, CancellationToken cancellationToken)
    {
        var progress = await _dbContext.UserProgress
            .FirstOrDefaultAsync(p => p.UserId == userId && p.PrincipleId == principleId, cancellationToken);

        if (progress is not null)
        {
            return progress;
        }

        progress = new UserProgress
        {
            UserId = userId,
            PrincipleId = principleId,
            Status = "in_progress",
            CurrentStep = "intro",
        };

        _dbContext.UserProgress.Add(progress);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return progress;
    }

    /// <summary>
    /// Calls the model, falling back to canned text if anything goes wrong.
    /// Python equivalent: <c>_run_structured_call()</c>.
    /// </summary>
    /// <remarks>
    /// <para><b>Why swallow the exception.</b> A lesson in progress is worth more than a
    /// perfect answer. If Groq is down, rate-limited or unconfigured, the learner still gets
    /// a sensible screen and can keep going, rather than hitting a 500. The failure is logged
    /// so the outage is visible to operators even though it is invisible to the learner.</para>
    ///
    /// <para>Two fallbacks exist because the intro step must supply four options and every
    /// other step must supply none.</para>
    /// </remarks>
    private async Task<MentorStructuredResponse> RunStructuredCallAsync(
        string step, string prompt, bool optionsExpected, CancellationToken cancellationToken)
    {
        try
        {
            var response = await _groqService.ConverseStructuredAsync(
                systemPrompt: SystemPrompt,
                userPrompt: prompt,
                cancellationToken: cancellationToken);

            // The step name is authoritative from the server, never from the model.
            return response with
            {
                Step = step,
                Options = optionsExpected ? response.Options : null,
            };
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Mentor call failed at step {Step}; using fallback copy.", step);

            return optionsExpected
                ? new MentorStructuredResponse(
                    Step: step,
                    Text: "Welcome! I'm your Leadership Avatar. Let's explore how we bring this principle to life. " +
                          "Imagine you face this workplace situation—how would you respond?",
                    Options:
                    [
                        "Take direct initiative to elevate standard and explain the vision.",
                        "Gather the core team first to align on immediate priorities.",
                        "Review customer feedback to isolate the single metric that matters.",
                        "Coach team members individually on how to achieve excellence.",
                    ],
                    AvatarState: "Presenting Story")
                : new MentorStructuredResponse(
                    Step: step,
                    Text: "Great work engaging with this principle! Together we build a high-performing culture.",
                    Options: null,
                    AvatarState: "Coaching Employee");
        }
    }

    /// <summary>
    /// Queues a chat row. Not saved here — the calling step commits it with everything else.
    /// Python equivalent: <c>_log_chat()</c>.
    /// </summary>
    private void LogChat(int userId, string role, string content, List<string>? retrievedChunkIds = null)
    {
        _dbContext.ChatMessages.Add(new ChatMessage
        {
            UserId = userId,
            Role = role,
            Content = content,
            RetrievedChunkIds = retrievedChunkIds,
            CreatedAt = DateTime.UtcNow,
        });
    }

    /// <summary>
    /// Wraps a model reply in the API response shape, forcing the server's own step name and
    /// avatar state over whatever the model suggested.
    /// </summary>
    private static LessonStepResponse BuildResponse(
        MentorStructuredResponse mentorResponse, string step, string avatarState, int xp) =>
        new(
            Step: step,
            Text: mentorResponse.Text,
            Options: mentorResponse.Options,
            AvatarState: avatarState,
            StepNumber: StepToNumber.GetValueOrDefault(step, 1),
            TotalSteps: TotalSteps,
            Xp: xp);
}
