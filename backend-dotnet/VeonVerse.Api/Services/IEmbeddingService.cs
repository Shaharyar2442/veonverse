namespace VeonVerse.Api.Services;

/// <summary>
/// Converts text into a dense vector for similarity search.
/// </summary>
/// <remarks>
/// Exists as an interface so <see cref="RetrievalService"/> depends on the capability rather
/// than on ONNX Runtime specifically — a test can substitute a fake, and swapping in a
/// hosted embedding API later would touch only the registration in <c>Program.cs</c>.
/// </remarks>
public interface IEmbeddingService
{
    /// <summary>
    /// Embeds <paramref name="text"/> as a unit-length vector of
    /// <c>EmbeddingDimension</c> (384) floats.
    /// </summary>
    float[] EmbedText(string text);
}
