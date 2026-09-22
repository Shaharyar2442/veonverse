using VeonVerse.Api.Dtos;

namespace VeonVerse.Api.Services;

/// <summary>
/// Vector similarity search over the ingested leadership material.
/// </summary>
public interface IRetrievalService
{
    /// <summary>
    /// Returns the <paramref name="k"/> passages most similar to <paramref name="query"/>,
    /// closest first.
    /// </summary>
    /// <param name="principleId">Restrict to one principle. Null searches all of them.</param>
    /// <param name="chunkType">Restrict to one category (definition, coaching_examples, ...). Null searches all.</param>
    /// <param name="k">How many passages to return. Four is the value used throughout the app.</param>
    Task<IReadOnlyList<RetrievedChunk>> RetrieveContextAsync(
        string query,
        int? principleId = null,
        string? chunkType = null,
        int k = 4,
        CancellationToken cancellationToken = default);
}
