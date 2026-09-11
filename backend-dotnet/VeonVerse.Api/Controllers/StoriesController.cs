using Microsoft.AspNetCore.Mvc;
using VeonVerse.Api.Services;

namespace VeonVerse.Api.Controllers;

/// <summary>
/// Live OpCo news for the hub page.
/// Python equivalent: the <c>stories</c> route in <c>backend/app/main.py</c>.
/// </summary>
[ApiController]
public class StoriesController : ControllerBase
{
    private readonly INewsService _newsService;

    public StoriesController(INewsService newsService)
    {
        _newsService = newsService;
    }

    /// <summary>
    /// Latest news across all operating companies, newest first.
    /// </summary>
    /// <param name="limit">How many stories to return. Default 8.</param>
    /// <param name="refresh">Skip the 30-minute cache and refetch now.</param>
    /// <remarks>
    /// GET /stories?limit=12&amp;refresh=false — the route is declared explicitly because it
    /// sits at the root rather than under a controller-name prefix, matching the Python URL.
    /// </remarks>
    [HttpGet("stories")]
    public async Task<ActionResult<StoriesResponse>> GetStories(
        [FromQuery] int limit = 8,
        [FromQuery] bool refresh = false,
        CancellationToken cancellationToken = default)
    {
        var stories = await _newsService.GetStoriesAsync(limit, refresh, cancellationToken);
        return Ok(stories);
    }
}
