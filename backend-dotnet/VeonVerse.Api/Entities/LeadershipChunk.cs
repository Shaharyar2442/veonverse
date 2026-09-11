using Pgvector;

namespace VeonVerse.Api.Entities;

/// <summary>
/// One embedded passage of leadership source material — the unit the RAG search returns.
/// Python equivalent: <c>class LeadershipChunk</c> in <c>backend/app/models.py</c>.
/// Table: <c>leadership_chunks</c>.
/// </summary>
/// <remarks>
/// <para>
/// This table is populated by the Python ingestion script (<c>backend/ingest_all.py</c>),
/// which writes 40 rows — four chunks for each of the ten principles. The .NET API reads
/// these rows; it does not create them.
/// </para>
/// <para>
/// The vectors are read back and compared by the .NET code, so its embeddings must land in
/// the same space. That is the whole reason <c>EmbeddingService</c> runs the identical
/// all-MiniLM-L6-v2 model rather than any convenient .NET alternative.
/// </para>
/// </remarks>
public class LeadershipChunk
{
    public int Id { get; set; }

    /// <summary>The passage text, injected into the prompt as grounding context.</summary>
    public string ChunkText { get; set; } = string.Empty;

    /// <summary>
    /// The 384-dimension embedding, stored in a PostgreSQL <c>vector</c> column by the
    /// pgvector extension. <see cref="Vector"/> comes from the Pgvector package and wraps
    /// a <c>ReadOnlyMemory&lt;float&gt;</c>.
    /// </summary>
    public Vector Embedding { get; set; } = null!;

    /// <summary>Which principle this passage belongs to. Indexed, because every search filters on it.</summary>
    public int PrincipleId { get; set; }

    /// <summary>
    /// Category of passage: definition, psychometric_tension, coaching_examples, etc.
    /// Lets a search ask for one kind of content specifically.
    /// </summary>
    public string? ChunkType { get; set; }

    /// <summary>Where the passage came from, for citation.</summary>
    public string SourceUrl { get; set; } = string.Empty;
}
