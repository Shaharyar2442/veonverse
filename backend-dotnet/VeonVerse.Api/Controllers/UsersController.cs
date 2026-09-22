using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeonVerse.Api.Data;
using VeonVerse.Api.Dtos;
using VeonVerse.Api.Services;

namespace VeonVerse.Api.Controllers;

/// <summary>
/// A user's progress and earned badges.
/// Python equivalent: the <c>get_progress</c> and <c>get_badges</c> routes in
/// <c>backend/app/main.py</c>.
/// </summary>
[ApiController]
[Route("users")]
public class UsersController : ControllerBase
{
    private readonly VeonVerseDbContext _dbContext;
    private readonly IGamificationService _gamificationService;

    public UsersController(VeonVerseDbContext dbContext, IGamificationService gamificationService)
    {
        _dbContext = dbContext;
        _gamificationService = gamificationService;
    }

    /// <summary>
    /// XP, level, streak, and per-principle progress.
    /// </summary>
    /// <remarks>GET /users/1/progress</remarks>
    [HttpGet("{userId:int}/progress")]
    public async Task<ActionResult<UserProgressResponse>> GetProgress(
        int userId,
        CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user is null)
        {
            return NotFound(new { detail = $"User {userId} not found." });
        }

        var progressItems = await _dbContext.UserProgress
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .ToListAsync(cancellationToken);

        return Ok(new UserProgressResponse(
            UserId: userId,
            Xp: user.Xp,
            // Falls back to recomputing if the stored level is somehow 0, so a bad row
            // cannot show the learner "Level 0".
            Level: user.Level > 0 ? user.Level : _gamificationService.ComputeLevel(user.Xp),
            StreakCount: user.StreakCount,
            XpToNextLevel: _gamificationService.XpToNextLevel(user.Xp),
            Progress: progressItems
                .Select(item => new ProgressItem(
                    PrincipleId: item.PrincipleId,
                    Status: item.Status,
                    CurrentStep: item.CurrentStep,
                    StepNumber: LessonService.StepToNumber.GetValueOrDefault(item.CurrentStep, 1),
                    ChosenScenarioAnswer: item.ChosenScenarioAnswer,
                    ReflectionResponse: item.ReflectionResponse,
                    CompletedAt: item.CompletedAt))
                .ToList()));
    }

    /// <summary>
    /// Badges this user has earned, most recent first.
    /// </summary>
    /// <remarks>GET /users/1/badges</remarks>
    [HttpGet("{userId:int}/badges")]
    public async Task<ActionResult<UserBadgesResponse>> GetBadges(
        int userId,
        CancellationToken cancellationToken = default)
    {
        var userExists = await _dbContext.Users
            .AsNoTracking()
            .AnyAsync(u => u.Id == userId, cancellationToken);

        if (!userExists)
        {
            return NotFound(new { detail = $"User {userId} not found." });
        }

        // Joins user_badges to badges so one query returns both the award time and the
        // badge's name and criteria.
        //
        // Note the ordering happens on the joined row, *before* projecting into BadgeItem.
        // EF Core cannot translate an OrderBy that reads a property off a record it is
        // constructing in the same query — it has no SQL column to sort on at that point.
        // Sorting first, projecting second, keeps the whole thing translatable to one query.
        var badges = await _dbContext.UserBadges
            .AsNoTracking()
            .Where(ub => ub.UserId == userId)
            .Join(
                _dbContext.Badges.AsNoTracking(),
                userBadge => userBadge.BadgeId,
                badge => badge.Id,
                (userBadge, badge) => new { userBadge.EarnedAt, Badge = badge })
            .OrderByDescending(row => row.EarnedAt)
            .Select(row => new BadgeItem(
                row.Badge.Id,
                row.Badge.Name,
                row.Badge.Criteria,
                row.EarnedAt))
            .ToListAsync(cancellationToken);

        return Ok(new UserBadgesResponse(userId, badges));
    }
}
