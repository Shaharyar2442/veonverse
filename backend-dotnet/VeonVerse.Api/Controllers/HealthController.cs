using Microsoft.AspNetCore.Mvc;
using VeonVerse.Api.Configuration;

namespace VeonVerse.Api.Controllers;

/// <summary>
/// Service banner and liveness probe.
/// Python equivalent: the <c>root</c> and <c>health</c> routes in <c>backend/app/main.py</c>.
/// </summary>
[ApiController]
public class HealthController : ControllerBase
{
    private readonly VeonVerseOptions _options;

    public HealthController(VeonVerseOptions options)
    {
        _options = options;
    }

    /// <summary>
    /// Service banner with links to the interesting routes.
    /// </summary>
    /// <remarks>GET /</remarks>
    [HttpGet("/")]
    public IActionResult Root() => Ok(new
    {
        status = "ok",
        app = _options.AppName,
        docs = "/docs",
        principles = "/principles",
    });

    /// <summary>
    /// Liveness check.
    /// </summary>
    /// <remarks>
    /// GET /health. Deliberately touches nothing — no database, no model — so it answers
    /// "is the process up?" and not "is every dependency healthy?". Load balancers and
    /// container orchestrators want the former, and a probe that queries the database will
    /// restart a perfectly good process during a brief database blip.
    /// </remarks>
    [HttpGet("/health")]
    public IActionResult Health() => Ok(new { status = "ok" });
}
