using System.Globalization;
using System.Xml.Linq;

namespace VeonVerse.Api.Services;

/// <summary>
/// Latest public news for each VEON operating company, pulled from Google News RSS.
/// Python equivalent: <c>backend/app/services/news.py</c>.
/// </summary>
/// <remarks>
/// <para><b>No API key needed</b> — Google News exposes a public RSS search endpoint, so this
/// is a plain HTTP GET per company.</para>
///
/// <para><b>Three things make it well-behaved:</b></para>
/// <list type="bullet">
///   <item><description><b>Caching</b> — results are held for 30 minutes, so a page load does
///   not fire seven outbound requests. Without this the endpoint would be both slow and a
///   good way to get rate-limited.</description></item>
///   <item><description><b>Parallel fetching</b> — all seven feeds are requested at once, so
///   a refresh costs roughly the slowest single request rather than the sum of all seven.</description></item>
///   <item><description><b>Failure isolation</b> — one unreachable feed returns an empty list
///   instead of throwing, so a single bad feed cannot blank the whole section.</description></item>
/// </list>
///
/// <para><b>Lifetime.</b> Singleton, because the cache must be shared across requests — a
/// per-request cache would never hit.</para>
/// </remarks>
public class NewsService : INewsService
{
    private const string FeedUrl = "https://news.google.com/rss/search";
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(30);

    /// <summary>Cap per company, so one prolific company cannot crowd out the rest.</summary>
    private const int MaxPerOpco = 3;

    /// <summary>The media namespace used by feeds that carry artwork.</summary>
    private static readonly XNamespace MediaNamespace = "http://search.yahoo.com/mrss/";

    /// <summary>The operating companies and the search term used for each.</summary>
    private static readonly IReadOnlyList<OpcoFeed> OpcoFeeds =
    [
        new("veon", "VEON HQ", "Dubai, UAE", "VEON telecom"),
        new("mobilink", "Mobilink Bank", "Pakistan", "Mobilink Microfinance Bank"),
        new("jazzworld", "JazzWorld", "Pakistan", "Jazz Pakistan telecom"),
        new("kyivstar", "Kyivstar", "Ukraine", "Kyivstar"),
        new("banglalink", "Banglalink", "Bangladesh", "Banglalink"),
        new("beeline-kz", "Beeline", "Kazakhstan", "Beeline Kazakhstan"),
        new("beeline-uz", "Beeline", "Uzbekistan", "Beeline Uzbekistan"),
    ];

    private readonly HttpClient _httpClient;
    private readonly ILogger<NewsService> _logger;

    // Guards the two cache fields below. SemaphoreSlim rather than `lock` because the
    // refresh it protects is asynchronous, and you cannot await inside a lock statement.
    private readonly SemaphoreSlim _cacheLock = new(1, 1);
    private List<Story> _cachedStories = [];
    private DateTimeOffset _fetchedAt = DateTimeOffset.MinValue;

    public NewsService(HttpClient httpClient, ILogger<NewsService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<StoriesResponse> GetStoriesAsync(
        int limit = 8,
        bool forceRefresh = false,
        CancellationToken cancellationToken = default)
    {
        await _cacheLock.WaitAsync(cancellationToken);

        try
        {
            var isStale =
                forceRefresh ||
                _cachedStories.Count == 0 ||
                DateTimeOffset.UtcNow - _fetchedAt > CacheTtl;

            if (isStale)
            {
                var fresh = await RefreshAsync(cancellationToken);

                // Only replace the cache if the refresh actually produced something.
                // A failed refresh therefore serves slightly stale data rather than nothing.
                if (fresh.Count > 0)
                {
                    _cachedStories = fresh;
                    _fetchedAt = DateTimeOffset.UtcNow;
                }
            }

            return new StoriesResponse(
                Stories: _cachedStories.Take(Math.Max(1, limit)).ToList(),
                Total: _cachedStories.Count,
                FetchedAt: _fetchedAt.ToUnixTimeSeconds());
        }
        finally
        {
            _cacheLock.Release();
        }
    }

    /// <summary>
    /// Fetches every feed in parallel and interleaves the results.
    /// </summary>
    /// <remarks>
    /// Interleaving means taking each company's top story first, then each company's second,
    /// and so on. Without it the first few cards would all belong to one company, which reads
    /// as a bug even though the data is correct.
    /// </remarks>
    private async Task<List<Story>> RefreshAsync(CancellationToken cancellationToken)
    {
        var fetchTasks = OpcoFeeds.Select(opco => FetchOpcoAsync(opco, cancellationToken));
        var results = await Task.WhenAll(fetchTasks);

        var interleaved = new List<Story>();

        for (var rank = 0; rank < MaxPerOpco; rank++)
        {
            var tier = results
                .Where(batch => batch.Count > rank)
                .Select(batch => batch[rank])
                // Newest first within each tier; undated entries sink to the bottom.
                .OrderByDescending(story => story.PublishedAt ?? string.Empty)
                .ToList();

            interleaved.AddRange(tier);
        }

        return interleaved;
    }

    /// <summary>
    /// Fetches and parses one company's feed. Never throws — a failure yields an empty list.
    /// </summary>
    private async Task<List<Story>> FetchOpcoAsync(OpcoFeed opco, CancellationToken cancellationToken)
    {
        try
        {
            var requestUrl = $"{FeedUrl}?q={Uri.EscapeDataString(opco.Query)}&hl=en-US&gl=US&ceid=US:en";

            using var request = new HttpRequestMessage(HttpMethod.Get, requestUrl);
            request.Headers.Add("User-Agent", "Mozilla/5.0 (compatible; VEONVERSE/1.0)");

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            response.EnsureSuccessStatusCode();

            var xml = await response.Content.ReadAsStringAsync(cancellationToken);
            var document = XDocument.Parse(xml);

            return document
                .Descendants("item")
                .Take(MaxPerOpco)
                .Select(item => ParseItem(item, opco))
                .OfType<Story>()
                .ToList();
        }
        catch (Exception exception)
        {
            // Deliberately broad: network error, timeout, malformed XML — the section should
            // degrade by one company, never fail as a whole.
            _logger.LogWarning(exception, "Could not load news for {Opco}.", opco.Name);
            return [];
        }
    }

    /// <summary>Turns one RSS item into a story, or null if it lacks a title or link.</summary>
    private static Story? ParseItem(XElement item, OpcoFeed opco)
    {
        var rawTitle = item.Element("title")?.Value.Trim() ?? string.Empty;
        var link = item.Element("link")?.Value.Trim() ?? string.Empty;

        if (rawTitle.Length == 0 || link.Length == 0)
        {
            return null;
        }

        var (headline, source) = SplitSource(rawTitle);

        return new Story(
            OpcoId: opco.Id,
            OpcoName: opco.Name,
            Place: opco.Place,
            Title: headline,
            Source: source,
            Url: link,
            ImageUrl: ExtractImageUrl(item),
            PublishedAt: ParsePublishedDate(item.Element("pubDate")?.Value));
    }

    /// <summary>
    /// Splits Google News' "Headline - Publisher" title format.
    /// </summary>
    /// <remarks>
    /// Splits on the <i>last</i> " - ", because headlines frequently contain hyphens of their
    /// own and the publisher is always the final segment.
    /// </remarks>
    private static (string Headline, string Source) SplitSource(string title)
    {
        var separatorIndex = title.LastIndexOf(" - ", StringComparison.Ordinal);

        return separatorIndex < 0
            ? (title.Trim(), string.Empty)
            : (title[..separatorIndex].Trim(), title[(separatorIndex + 3)..].Trim());
    }

    /// <summary>
    /// Finds article artwork when the feed provides it.
    /// </summary>
    /// <remarks>
    /// Google News' search feed carries none, so this returns null there and the UI falls
    /// back to the company logo. Newsroom feeds often do include media tags, and this picks
    /// them up with no further change.
    /// </remarks>
    private static string? ExtractImageUrl(XElement item)
    {
        foreach (var tagName in new[] { "content", "thumbnail" })
        {
            var url = item.Element(MediaNamespace + tagName)?.Attribute("url")?.Value;

            if (!string.IsNullOrWhiteSpace(url))
            {
                return url;
            }
        }

        var enclosure = item.Element("enclosure");
        var enclosureType = enclosure?.Attribute("type")?.Value ?? string.Empty;

        return enclosureType.StartsWith("image/", StringComparison.OrdinalIgnoreCase)
            ? enclosure?.Attribute("url")?.Value
            : null;
    }

    /// <summary>
    /// Converts an RFC 1123 RSS date ("Mon, 08 Sep 2025 14:03:00 GMT") to ISO 8601.
    /// Returns null for missing or unparseable dates, which then sort last.
    /// </summary>
    private static string? ParsePublishedDate(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        return DateTimeOffset.TryParse(raw, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed)
            ? parsed.ToString("o")
            : null;
    }

    /// <summary>One operating company and the query used to find news about it.</summary>
    private record OpcoFeed(string Id, string Name, string Place, string Query);
}

/// <summary>A single news item, shaped exactly as the hub page expects it.</summary>
public record Story(
    string OpcoId,
    string OpcoName,
    string Place,
    string Title,
    string Source,
    string Url,
    string? ImageUrl,
    string? PublishedAt
);

/// <summary>
/// The <c>/stories</c> payload.
/// </summary>
/// <param name="Total">Total cached stories, which may exceed the number returned.</param>
/// <param name="FetchedAt">Unix seconds of the last successful refresh, so clients can show freshness.</param>
public record StoriesResponse(IReadOnlyList<Story> Stories, int Total, long FetchedAt);
