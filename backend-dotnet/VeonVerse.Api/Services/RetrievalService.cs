using Microsoft.EntityFrameworkCore;
using Pgvector;
using Pgvector.EntityFrameworkCore;
using VeonVerse.Api.Data;
using VeonVerse.Api.Dtos;

namespace VeonVerse.Api.Services;

/// <summary>
/// The "R" in RAG: finds the leadership passages most similar to a question.
/// Python equivalent: <c>retrieve_context()</c> in <c>backend/app/services/retrieval.py</c>.
/// </summary>
/// <remarks>
/// <para><b>What it does, in one sentence:</b> embed the query, ask PostgreSQL for the
/// <c>k</c> stored chunks whose vectors sit closest to it, and hand them back so a prompt
/// can be built from real source text instead of the model's memory.</para>
///
/// <para><b>Why the search happens in the database.</b> The obvious implementation — load
/// all chunks, compare in C# — would work at 40 rows and collapse at 40,000. Sending the
/// comparison to PostgreSQL means pgvector does the distance maths next to the data and
/// returns only the handful of rows that matter. It can also use a vector index, which no
/// amount of in-process looping can.</para>
///
/// <para><b>Distance versus score.</b> pgvector's <c>&lt;=&gt;</c> operator returns cosine
/// <i>distance</i>: 0 is identical, 2 is opposite. The API reports a <i>score</i> instead,
/// where higher is better, via <c>1 - distance</c> clamped at zero — the same conversion the
/// Python version does, so scores are comparable across both stacks.</para>
/// </remarks>
public class RetrievalService : IRetrievalService
{
    private readonly VeonVerseDbContext _dbContext;
    private readonly IEmbeddingService _embeddingService;
    private readonly ILogger<RetrievalService> _logger;

    public RetrievalService(
        VeonVerseDbContext dbContext,
        IEmbeddingService embeddingService,
        ILogger<RetrievalService> logger)
    {
        _dbContext = dbContext;
        _embeddingService = embeddingService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<RetrievedChunk>> RetrieveContextAsync(
        string query,
        int? principleId = null,
        string? chunkType = null,
        int k = 4,
        CancellationToken cancellationToken = default)
    {
        // Step 1: put the question into the same vector space as the stored passages.
        var queryVector = new Vector(_embeddingService.EmbedText(query));

        // Step 2: build the query. Filters are applied before the ordering so the distance
        // calculation only runs over candidate rows.
        var chunks = _dbContext.LeadershipChunks.AsNoTracking();

        if (principleId is not null)
        {
            chunks = chunks.Where(chunk => chunk.PrincipleId == principleId);
        }

        if (chunkType is not null)
        {
            chunks = chunks.Where(chunk => chunk.ChunkType == chunkType);
        }

        // Step 3: order by cosine distance and keep the closest k.
        // `CosineDistance` is translated by Pgvector.EntityFrameworkCore into the `<=>`
        // operator, so this executes as SQL — the rows never travel to C# to be sorted.
        var results = await chunks
            .Select(chunk => new
            {
                chunk.Id,
                chunk.ChunkText,
                chunk.PrincipleId,
                chunk.ChunkType,
                chunk.SourceUrl,
                Distance = chunk.Embedding.CosineDistance(queryVector),
            })
            .OrderBy(row => row.Distance)
            .Take(k)
            .ToListAsync(cancellationToken);

        _logger.LogDebug(
            "Retrieved {Count} chunks for principle {PrincipleId} (k={K}).",
            results.Count, principleId, k);

        // Step 4: convert distance to a friendlier 0-1 score.
        return results
            .Select(row => new RetrievedChunk(
                Id: row.Id.ToString(),
                Score: Math.Max(0.0, 1.0 - row.Distance),
                ChunkText: row.ChunkText,
                PrincipleId: row.PrincipleId,
                ChunkType: row.ChunkType,
                SourceUrl: row.SourceUrl))
            .ToList();
    }
}
