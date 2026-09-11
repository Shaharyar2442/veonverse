using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeonVerse.Api.Data;
using VeonVerse.Api.Dtos;

namespace VeonVerse.Api.Controllers;

/// <summary>
/// Reads the ten leadership principles.
/// Python equivalent: the <c>list_principles</c> and <c>get_principle</c> routes in
/// <c>backend/app/main.py</c>.
/// </summary>
/// <remarks>
/// <para>A controller is the .NET counterpart of a FastAPI route function. The attributes do
/// what FastAPI's decorators did: <c>[ApiController]</c> switches on automatic model
/// validation and 400 responses, <c>[Route]</c> sets the URL prefix, and
/// <c>[HttpGet("{id}")]</c> binds a method to a verb and path.</para>
///
/// <para>Both endpoints merge a principle with the caller's progress, so the UI can grey out
/// or tick each principle without a second request.</para>
/// </remarks>
[ApiController]
[Route("principles")]
public class PrinciplesController : ControllerBase
{
    private readonly VeonVerseDbContext _dbContext;

    public PrinciplesController(VeonVerseDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <summary>
    /// All ten principles in display order, each annotated with this user's status.
    /// </summary>
    /// <param name="userId">Whose progress to merge in. Defaults to the demo user.</param>
    /// <remarks>GET /principles?user_id=1</remarks>
    [HttpGet]
    public async Task<ActionResult<PrincipleListResponse>> ListPrinciples(
        [FromQuery(Name = "user_id")] int userId = 1,
        CancellationToken cancellationToken = default)
    {
        var principles = await _dbContext.Principles
            .AsNoTracking()
            .OrderBy(p => p.Number)
            .ToListAsync(cancellationToken);

        // One query for all progress rows, then an in-memory lookup — rather than a query
        // per principle, which would be ten round trips for the same data.
        var statusByPrincipleId = await _dbContext.UserProgress
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .ToDictionaryAsync(p => p.PrincipleId, p => p.Status, cancellationToken);

        var items = principles
            .Select(p => new PrincipleItem(
                Id: p.Id,
                Number: p.Number,
                Title: p.Title,
                OfficialText: p.OfficialText,
                Summary: p.Summary,
                PsychometricTension: p.PsychometricTension,
                HoganCompetencies: p.HoganCompetencies,
                BehavioralDomains: p.BehavioralDomains,
                // A principle never touched has no progress row at all.
                Status: statusByPrincipleId.GetValueOrDefault(p.Id, "not_started")))
            .ToList();

        return Ok(new PrincipleListResponse(items));
    }

    /// <summary>
    /// One principle by id.
    /// </summary>
    /// <remarks>GET /principles/3?user_id=1 — returns 404 if the principle does not exist.</remarks>
    [HttpGet("{principleId:int}")]
    public async Task<ActionResult<PrincipleItem>> GetPrinciple(
        int principleId,
        [FromQuery(Name = "user_id")] int userId = 1,
        CancellationToken cancellationToken = default)
    {
        var principle = await _dbContext.Principles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == principleId, cancellationToken);

        if (principle is null)
        {
            return NotFound(new { detail = $"Principle {principleId} not found." });
        }

        var progress = await _dbContext.UserProgress
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId && p.PrincipleId == principleId, cancellationToken);

        return Ok(new PrincipleItem(
            Id: principle.Id,
            Number: principle.Number,
            Title: principle.Title,
            OfficialText: principle.OfficialText,
            Summary: principle.Summary,
            PsychometricTension: principle.PsychometricTension,
            HoganCompetencies: principle.HoganCompetencies,
            BehavioralDomains: principle.BehavioralDomains,
            Status: progress?.Status ?? "not_started"));
    }
}
