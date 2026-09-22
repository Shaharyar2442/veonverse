namespace VeonVerse.Api.Configuration;

/// <summary>
/// Strongly-typed application settings — the .NET counterpart of the Pydantic
/// <c>Settings</c> class in <c>backend/app/config.py</c>.
/// </summary>
/// <remarks>
/// <para>Values are bound in <c>Program.cs</c> from, in increasing order of precedence:
/// <c>appsettings.json</c>, then the repo-root <c>.env</c> file, then real environment
/// variables. The <c>.env</c> loading is what keeps this project drop-in compatible with
/// the Python backend — both read the same file with the same key names.</para>
///
/// <para>The names below match the .env keys exactly (GROQ_API_KEY, DATABASE_URL, ...).</para>
/// </remarks>
public class VeonVerseOptions
{
    /// <summary>Configuration section name used when binding.</summary>
    public const string SectionName = "VeonVerse";

    /// <summary>
    /// The embedding width the rest of the system assumes. all-MiniLM-L6-v2 emits 384
    /// floats; the pgvector column is declared <c>vector(384)</c>. Changing this requires
    /// a different model *and* a full re-ingest, so it is a compile-time constant used by
    /// the DbContext rather than a freely tunable setting.
    /// </summary>
    public const int EmbeddingDimensionDefault = 384;

    /// <summary>Title shown on the root endpoint and in Swagger.</summary>
    public string AppName { get; set; } = "VEONVERSE AI Leadership Mentor";

    /// <summary>Groq API key. Empty means the LLM endpoints will fall back to canned text.</summary>
    public string GroqApiKey { get; set; } = string.Empty;

    /// <summary>
    /// Groq model id. Must support the <c>json_object</c> response format, because every
    /// mentor call demands strict JSON back.
    /// </summary>
    public string GroqModelId { get; set; } = "openai/gpt-oss-120b";

    /// <summary>Informational — records which model produced the stored vectors.</summary>
    public string LocalEmbeddingModel { get; set; } = "sentence-transformers/all-MiniLM-L6-v2";

    /// <summary>Vector width. Should stay at 384 to match the ingested data.</summary>
    public int EmbeddingDimension { get; set; } = EmbeddingDimensionDefault;

    /// <summary>
    /// Connection string. Accepts the SQLAlchemy URL form found in <c>.env</c>
    /// (<c>postgresql+psycopg2://user:pass@host:port/db</c>); it is translated to Npgsql's
    /// key/value form by <c>DatabaseUrlConverter</c>.
    /// </summary>
    public string DatabaseUrl { get; set; } = "postgresql+psycopg2://veonverse:veonverse@localhost:15432/veonverse";

    /// <summary>Principle used by the mentor endpoint when the caller does not name one.</summary>
    public int DefaultPrincipleId { get; set; } = 1;

    /// <summary>XP granted once, when a learner finishes a principle's reflection step.</summary>
    public int LessonXpReward { get; set; } = 100;

    /// <summary>Folder holding <c>model.onnx</c> and <c>vocab.txt</c>, relative to the app's content root.</summary>
    public string OnnxModelDirectory { get; set; } = "Models_Onnx";
}
