using Microsoft.ML.OnnxRuntime;
using Microsoft.ML.OnnxRuntime.Tensors;
using Microsoft.ML.Tokenizers;
using VeonVerse.Api.Configuration;

namespace VeonVerse.Api.Services;

/// <summary>
/// Turns text into a 384-dimension vector using the all-MiniLM-L6-v2 model, run locally
/// through ONNX Runtime.
/// Python equivalent: <c>BedrockService.embed_text()</c> in <c>backend/app/services/bedrock.py</c>,
/// which calls <c>SentenceTransformer.encode(text, normalize_embeddings=True)</c>.
/// </summary>
/// <remarks>
/// <para><b>Why this is the fiddliest file in the project.</b> Python gets sentence
/// embeddings in one line because <c>sentence-transformers</c> hides three separate steps.
/// .NET has no such library, so all three are spelled out here:</para>
/// <list type="number">
///   <item><description><b>Tokenize</b> — split text into WordPiece ids the model understands.</description></item>
///   <item><description><b>Run the model</b> — produces one vector per <i>token</i>, not per sentence.</description></item>
///   <item><description><b>Mean-pool and normalize</b> — collapse the token vectors into one
///   sentence vector, ignoring padding, then scale it to unit length.</description></item>
/// </list>
///
/// <para><b>Why it must match Python exactly.</b> The 40 rows in <c>leadership_chunks</c>
/// were embedded by the Python script. A search compares a query vector against those stored
/// vectors, so if this produced even slightly different numbers, retrieval would silently
/// return the wrong passages — no error, just worse answers. Every step below mirrors what
/// sentence-transformers does for this specific model.</para>
///
/// <para><b>Lifetime.</b> Registered as a singleton. The model is ~90 MB and takes a moment
/// to load, so it is loaded once at startup and reused. <see cref="InferenceSession"/> is
/// safe to call from multiple threads at once, so concurrent requests share it freely.</para>
/// </remarks>
public sealed class EmbeddingService : IEmbeddingService, IDisposable
{
    /// <summary>
    /// Longest token sequence the model will process. Matches all-MiniLM-L6-v2's
    /// <c>max_seq_length</c> of 256 — anything past this is truncated, as in Python.
    /// </summary>
    private const int MaxSequenceLength = 256;

    private readonly InferenceSession _session;
    private readonly BertTokenizer _tokenizer;
    private readonly ILogger<EmbeddingService> _logger;
    private readonly int _embeddingDimension;

    public EmbeddingService(
        VeonVerseOptions options,
        IWebHostEnvironment environment,
        ILogger<EmbeddingService> logger)
    {
        _logger = logger;
        _embeddingDimension = options.EmbeddingDimension;

        var modelDirectory = Path.IsPathRooted(options.OnnxModelDirectory)
            ? options.OnnxModelDirectory
            : Path.Combine(environment.ContentRootPath, options.OnnxModelDirectory);

        var modelPath = Path.Combine(modelDirectory, "model.onnx");
        var vocabPath = Path.Combine(modelDirectory, "vocab.txt");

        if (!File.Exists(modelPath) || !File.Exists(vocabPath))
        {
            throw new FileNotFoundException(
                $"Embedding model files missing. Expected 'model.onnx' and 'vocab.txt' in '{modelDirectory}'. " +
                "See backend-dotnet/README.md for the download commands.");
        }

        // all-MiniLM-L6-v2 is an *uncased* model: its vocabulary contains only lowercase
        // entries, and accents are stripped. Both flags must be on or common words tokenize
        // to [UNK] and the resulting vectors drift away from the Python ones.
        _tokenizer = BertTokenizer.Create(vocabPath, new BertOptions
        {
            LowerCaseBeforeTokenization = true,
            RemoveNonSpacingMarks = true,
        });

        _session = new InferenceSession(modelPath);

        _logger.LogInformation(
            "Embedding model loaded from {ModelPath}. Inputs: {Inputs}. Outputs: {Outputs}.",
            modelPath,
            string.Join(", ", _session.InputMetadata.Keys),
            string.Join(", ", _session.OutputMetadata.Keys));
    }

    /// <inheritdoc />
    public float[] EmbedText(string text)
    {
        ArgumentNullException.ThrowIfNull(text);

        // ---- Step 1: tokenize -------------------------------------------------------
        // Produces WordPiece ids wrapped in the special tokens the model expects:
        // [CLS] at the front and [SEP] at the end.
        var tokenIds = _tokenizer.EncodeToIds(text);

        // Truncate the same way Python does, but keep the final [SEP] in place so the
        // sequence still looks well-formed to the model.
        if (tokenIds.Count > MaxSequenceLength)
        {
            var truncated = tokenIds.Take(MaxSequenceLength).ToArray();
            truncated[^1] = tokenIds[^1];
            tokenIds = truncated;
        }

        var sequenceLength = tokenIds.Count;

        // ---- Step 2: build the model inputs ------------------------------------------
        // Shape is [batch, sequence]. Only one string is embedded at a time, so batch = 1.
        var inputIds = new DenseTensor<long>(new[] { 1, sequenceLength });
        var attentionMask = new DenseTensor<long>(new[] { 1, sequenceLength });
        var tokenTypeIds = new DenseTensor<long>(new[] { 1, sequenceLength });

        for (var i = 0; i < sequenceLength; i++)
        {
            inputIds[0, i] = tokenIds[i];
            // Every position here is a real token (nothing is padded in a batch of one),
            // so the whole mask is 1s. The mask still matters in step 3, which is written
            // to honour it rather than assume.
            attentionMask[0, i] = 1;
            // Single-sentence input, so every token belongs to segment 0.
            tokenTypeIds[0, i] = 0;
        }

        var inputs = new List<NamedOnnxValue>
        {
            NamedOnnxValue.CreateFromTensor("input_ids", inputIds),
            NamedOnnxValue.CreateFromTensor("attention_mask", attentionMask),
            NamedOnnxValue.CreateFromTensor("token_type_ids", tokenTypeIds),
        };

        // ---- Step 3: run the model ----------------------------------------------------
        using var results = _session.Run(inputs);

        // "last_hidden_state" is one vector per token: shape [1, sequenceLength, 384].
        // What we want is a single vector for the whole sentence, which is what step 4 is for.
        var lastHiddenState = results.First(r => r.Name == "last_hidden_state").AsTensor<float>();

        // ---- Step 4: mean pooling ------------------------------------------------------
        // Average the token vectors, counting only positions the attention mask marks as
        // real. This is exactly the pooling layer sentence-transformers applies to this
        // model; using the [CLS] vector instead — a common shortcut — would give different
        // numbers and break comparability with the stored embeddings.
        var pooled = new float[_embeddingDimension];
        var activeTokenCount = 0;

        for (var token = 0; token < sequenceLength; token++)
        {
            if (attentionMask[0, token] == 0)
            {
                continue;
            }

            activeTokenCount++;

            for (var dimension = 0; dimension < _embeddingDimension; dimension++)
            {
                pooled[dimension] += lastHiddenState[0, token, dimension];
            }
        }

        if (activeTokenCount > 0)
        {
            for (var dimension = 0; dimension < _embeddingDimension; dimension++)
            {
                pooled[dimension] /= activeTokenCount;
            }
        }

        // ---- Step 5: L2 normalize -------------------------------------------------------
        // Scale to unit length, matching `normalize_embeddings=True` in the Python call.
        // With unit vectors, cosine distance and dot product agree, which is what makes
        // pgvector's `<=>` operator directly comparable to the scores Python produced.
        var magnitude = 0.0;
        foreach (var value in pooled)
        {
            magnitude += value * value;
        }

        magnitude = Math.Sqrt(magnitude);

        if (magnitude > 0)
        {
            for (var dimension = 0; dimension < _embeddingDimension; dimension++)
            {
                pooled[dimension] = (float)(pooled[dimension] / magnitude);
            }
        }

        return pooled;
    }

    public void Dispose() => _session.Dispose();
}
