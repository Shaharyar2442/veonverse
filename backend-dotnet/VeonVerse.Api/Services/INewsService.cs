namespace VeonVerse.Api.Services;

/// <summary>
/// Cached OpCo news for the hub page.
/// </summary>
public interface INewsService
{
    /// <summary>
    /// Returns up to <paramref name="limit"/> stories, newest first, served from a 30-minute cache.
    /// </summary>
    /// <param name="forceRefresh">Bypass the cache and refetch every feed now.</param>
    Task<StoriesResponse> GetStoriesAsync(
        int limit = 8,
        bool forceRefresh = false,
        CancellationToken cancellationToken = default);
}
